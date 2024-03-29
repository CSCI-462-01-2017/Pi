/* jshint expr:true */
import {
    describe,
    it,
    beforeEach,
    afterEach
} from 'mocha';
import {expect} from 'chai';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import {enableGhostOAuth} from '../helpers/configuration';
import {
    stubSuccessfulOAuthConnect,
    stubFailedOAuthConnect
} from '../helpers/oauth';

describe('Acceptance: Signup', function() {
    let application;

    beforeEach(function() {
        application = startApp();
    });

    afterEach(function() {
        destroyApp(application);
    });

    it('can signup successfully', function() {
        server.get('/authentication/invitation', function () {
            return {
                invitation: [{valid: true}]
            };
        });

        server.post('/authentication/invitation/', function ({users}, {requestBody}) {
            let params = JSON.parse(requestBody);
            expect(params.invitation[0].name).to.equal('Test User');
            expect(params.invitation[0].email).to.equal('kevin+test2@ghost.org');
            expect(params.invitation[0].password).to.equal('ValidPassword');
            expect(params.invitation[0].token).to.equal('MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

            // ensure that `/users/me/` request returns a user
            let role = server.create('role', {name: 'Author'});
            users.create({email: 'kevin@test2@ghost.org', roles: [role]});

            return {
                invitation: [{
                    message: 'Invitation accepted.'
                }]
            };
        });

        // token details:
        // "1470346017929|kevin+test2@ghost.org|2cDnQc3g7fQTj9nNK4iGPSGfvomkLdXf68FuWgS66Ug="
        visit('/signup/MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

        andThen(function () {
            expect(currentPath()).to.equal('signup');

            // email address should be pre-filled and disabled
            expect(
                find('input[name="email"]').val(),
                'email field value'
            ).to.equal('kevin+test2@ghost.org');

            expect(
                find('input[name="email"]').is(':disabled'),
                'email field is disabled'
            ).to.be.true;
        });

        // focus out in Name field triggers inline error
        triggerEvent('input[name="name"]', 'blur');

        andThen(function () {
            expect(
                find('input[name="name"]').closest('.form-group').hasClass('error'),
                'name field group has error class when empty'
            ).to.be.true;

            expect(
                find('input[name="name"]').closest('.form-group').find('.response').text().trim(),
                'name inline-error text'
            ).to.match(/Please enter a name/);
        });

        // entering text in Name field clears error
        fillIn('input[name="name"]', 'Test User');
        triggerEvent('input[name="name"]', 'blur');

        andThen(function () {
            expect(
                find('input[name="name"]').closest('.form-group').hasClass('error'),
                'name field loses error class after text input'
            ).to.be.false;

            expect(
                find('input[name="name"]').closest('.form-group').find('.response').text().trim(),
                'name field error is removed after text input'
            ).to.equal('');
        });

        // focus out in Name field triggers inline error
        triggerEvent('input[name="password"]', 'blur');

        andThen(function () {
            expect(
                find('input[name="password"]').closest('.form-group').hasClass('error'),
                'password field group has error class when empty'
            ).to.be.true;

            expect(
                find('input[name="password"]').closest('.form-group').find('.response').text().trim(),
                'password field error text'
            ).to.match(/must be at least 8 characters/);
        });

        // entering valid text in Password field clears error
        fillIn('input[name="password"]', 'ValidPassword');
        triggerEvent('input[name="password"]', 'blur');

        andThen(function () {
            expect(
                find('input[name="password"]').closest('.form-group').hasClass('error'),
                'password field loses error class after text input'
            ).to.be.false;

            expect(
                find('input[name="password"]').closest('.form-group').find('.response').text().trim(),
                'password field error is removed after text input'
            ).to.equal('');
        });

        // submitting sends correct details and redirects to content screen
        click('.btn-green');

        andThen(function () {
            expect(currentPath()).to.equal('posts.index');
        });
    });

    it('redirects if already logged in');
    it('redirects with alert on invalid token');
    it('redirects with alert on non-existant or expired token');

    describe('using Ghost OAuth', function () {
        beforeEach(function () {
            enableGhostOAuth(server);

            let {invites, users} = server.schema;

            let user = users.create({name: 'Test Invite Creator'});

            invites.create({
                email: 'kevin+test2@ghost.org',
                createdBy: user.id
            });
        });

        it('can sign up sucessfully', function () {
            stubSuccessfulOAuthConnect(application);

            // token details:
            // "1470346017929|kevin+test2@ghost.org|2cDnQc3g7fQTj9nNK4iGPSGfvomkLdXf68FuWgS66Ug="
            visit('/signup/MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

            andThen(() => {
                expect(currentPath()).to.equal('signup');

                expect(
                    find('.gh-flow-content header p').text().trim(),
                    'form header text'
                ).to.equal('Accept your invite from Test Invite Creator');
            });

            click('button.login');

            andThen(() => {
                expect(currentPath()).to.equal('posts.index');
            });
        });

        it('handles failed connect', function () {
            stubFailedOAuthConnect(application);

            // token details:
            // "1470346017929|kevin+test2@ghost.org|2cDnQc3g7fQTj9nNK4iGPSGfvomkLdXf68FuWgS66Ug="
            visit('/signup/MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

            click('button.login');

            andThen(() => {
                expect(currentPath()).to.equal('signup');

                expect(
                    find('.main-error').text().trim(),
                    'flow error text'
                ).to.match(/authentication with ghost\.org denied or failed/i);
            });
        });
    });
});
