import featureTogglesEnabled from './fixtures/toggle-covid-feature.json';

describe('COVID-19 Vaccination Preparation Form', () => {
  describe('when entering valid contact information without signing in', () => {
    before(() => {
      cy.server();
      cy.route('GET', '/v0/feature_toggles*', featureTogglesEnabled).as(
        'feature',
      );
      cy.visit('health-care/covid-19-vaccine/stay-informed/');
      cy.wait('@feature');
      cy.injectAxe();
    });

    it('should successfully submit the vaccine preparation form', () => {
      // Intro page
      cy.axeCheck();
      cy.get('.vads-l-row').contains(
        'COVID-19 vaccines: Stay informed and help us prepare',
      );

      cy.get('.usa-button').contains('Sign in');

      cy.findByText('Continue without signing in', { selector: 'a' }).click();

      // Form page
      cy.url().should(
        'include',
        '/health-care/covid-19-vaccine/stay-informed/form',
      );
      cy.axeCheck();
      cy.get('#covid-vaccination-heading-form').contains(
        'Fill out the form below',
      );

      cy.findByLabelText(/First name/i)
        .clear()
        .type('Testing');

      cy.findByLabelText(/Last name/i)
        .clear()
        .type('Veteran');

      cy.findByLabelText(/^Month/).select('Jun');

      cy.findByLabelText(/^Day/).select('30');

      cy.findByLabelText(/Year/i)
        .clear()
        .type('1950');

      cy.findByLabelText(/Email address/i)
        .clear()
        .type('test@example.com');

      cy.findByLabelText(/Phone/i)
        .clear()
        .type('8005551234');

      cy.findByLabelText(/Zip code/i)
        .clear()
        .type('10001');

      cy.get('#root_locationDetails-label').contains(
        'Will you be in this zip code for the next 6 to 12 months?',
      );
      cy.get('#root_locationDetails_0').check();

      cy.get('#root_vaccineInterest-label').contains(
        'Do you plan to get a COVID-19 vaccine when one is available to you?',
      );
      cy.get('#root_vaccineInterest_0').check();

      cy.axeCheck();
      cy.route('POST', '**/covid_vaccine/v0/registration', {
        status: 200,
      }).as('response');

      cy.get('.usa-button').contains('Submit form');
      cy.get('.usa-button').click();
      cy.wait('@response');

      // Confirmation page
      cy.url().should(
        'include',
        '/health-care/covid-19-vaccine/stay-informed/confirmation',
      );
      cy.axeCheck();
      cy.get('#covid-vaccination-heading-confirmation').contains(
        "We've received your information",
      );

      cy.get('.vads-l-row').contains(
        'Thank you for signing up to stay informed about COVID-19 vaccines at VA',
      );

      cy.get('.vads-l-row').contains(
        'Remember: This form doesn’t sign you up to get a vaccine',
      );
    });
  });
});
