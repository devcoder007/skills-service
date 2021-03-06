/*
 * Copyright 2020 SkillTree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// const attachFiles = require('cypress-form-data-with-file-upload');

describe('Subjects Tests', () => {

    beforeEach(() => {
        cy.request('POST', '/app/projects/proj1', {
            projectId: 'proj1',
            name: "proj1"
        })
    });

    it('create subject with special chars', () => {
        const expectedId = 'LotsofspecialPcharsSubject';
        const providedName = "!L@o#t$s of %s^p&e*c(i)/?#a_l++_|}{P c'ha'rs";
        cy.server();
        cy.route('POST', `/admin/projects/proj1/subjects/${expectedId}`).as('postNewSubject');
        cy.route('POST', '/admin/projects/proj1/subjectNameExists').as('nameExists');
        cy.route('GET', '/admin/projects/proj1/subjects').as('loadSubjects');

        cy.visit('/projects/proj1');
        cy.wait('@loadSubjects');
        cy.clickButton('Subject');

        cy.get('#subjName').type(providedName);
        cy.wait('@nameExists');
        cy.getIdField().should('have.value', expectedId);

        cy.clickSave();
        cy.wait('@postNewSubject');

        cy.contains('ID: Lotsofspecial')
    });

    it('upload custom icon - invalid mime type client validation', () => {
        cy.request('POST', '/admin/projects/proj1/subjects/subj1', {
            projectId: 'proj1',
            subjectId: 'subj1',
            name: "Subject 1"
        });

        cy.visit('/projects/proj1/');

        cy.get('.subject-settings .dropdown-toggle').click();

        cy.get('a.dropdown-item').contains('Edit').click();

        cy.get('div.modal-content .text-info i.fa-question-circle').click();

        cy.get('a.nav-link').contains('Custom').click();

        const filename = 'invalid_file.txt';
        cy.fixture(filename).then(fileContent => {
            cy.get('input[type=file]').upload(
                {fileContent: fileContent, fileName: filename, mimeType: 'text/plain'},
                { force: true });

            cy.get('.alert-danger').contains('File is not an image format');
        });
    });

    it('upload custom icon - server side error', () => {
        cy.request('POST', '/admin/projects/proj1/subjects/subj1', {
            projectId: 'proj1',
            subjectId: 'subj1',
            name: "Subject 1"
        });

        cy.server();

        cy.route({
            method: 'POST',
            url: '/admin/projects/proj1/icons/upload',
            status: 400,
            response: {explanation: 'Something bad'}
        }).as('addAdmin');

        cy.visit('/projects/proj1/');

        cy.get('.subject-settings .dropdown-toggle').click();

        cy.get('a.dropdown-item').contains('Edit').click();

        cy.get('div.modal-content .text-info i.fa-question-circle').click();

        cy.get('a.nav-link').contains('Custom').click();

        const filename = 'valid_icon.png';
        cy.fixture(filename).then(fileContent => {
            cy.get('input[type=file]').upload(
                {fileContent: fileContent, fileName: filename, mimeType: 'image/png'},
                { force: true });

            cy.get('.toast-body').contains('Encountered error when uploading');
        });
    });


});
