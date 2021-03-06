import { expect } from 'chai';

import redirectToClaimTypePage from '../../migrations/01-require-claim-type';
import upgradeHasSeparationPay from '../../migrations/03-upgrade-hasSeparationPay';
import formConfig from '../../config/form';

describe('526 v2 migrations', () => {
  describe('01-require-claim-type', () => {
    it('should change the URL to /claim-type', () => {
      const savedData = {
        formData: {},
        metadata: {
          returnUrl: '/some-other-page',
        },
      };
      const migratedData = redirectToClaimTypePage(savedData);
      expect(migratedData.metadata.returnUrl).to.equal('/claim-type');
    });
    it('should not change the URL if still on the veteran info page', () => {
      const savedData = {
        formData: {},
        metadata: {
          returnUrl: '/veteran-information',
        },
      };
      const migratedData = redirectToClaimTypePage(savedData);
      expect(migratedData.metadata.returnUrl).to.equal('/veteran-information');
    });
    it('should not modify anything except the returnUrl', () => {
      const savedData = {
        formData: { foo: 'bar' },
        metadata: {
          returnUrl: '/some-other-page',
        },
      };
      const migratedData = redirectToClaimTypePage(savedData);
      expect(migratedData.formData).to.equal(savedData.formData);
    });
    // Sanity check
    it('/claim-type should be a valid url', () => {
      expect(formConfig.chapters.veteranDetails.pages.claimType.path).to.equal(
        'claim-type',
      );
    });
  });
  describe('02-upgrade-separationPay', () => {
    it('should migrate view:hasSeparationPay to hasSeparationPay', () => {
      const savedData = {
        'view:hasSeparationPay': true,
      };
      const migratedData = upgradeHasSeparationPay(savedData);
      expect(migratedData['view:hasSeparationPay']).to.be.undefined;
      expect(savedData['view:hasSeparationPay']).to.be.true;
      expect(migratedData.hasSeparationPay).to.be.true;
    });
  });
});
