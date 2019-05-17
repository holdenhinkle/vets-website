const entityElementsFromPages = require('./entityElementsForPages.graphql');
const {
  featureFlags,
  enabledFeatureFlags,
} = require('../../../../utilities/featureFlags');

module.exports = `
  fragment healthCareLocalFacilityPage on NodeHealthCareLocalFacility {
    ${entityElementsFromPages}
    changed
    fieldFacilityLocatorApiId
    fieldNicknameForThisFacility
    fieldIntroText
    fieldLocationServices {
      entity {
        ... on ParagraphHealthCareLocalFacilityServi {
          entityId
          entityBundle
          fieldTitle
          fieldWysiwyg {
            processed
          }
        }
      }
    }
    fieldMainLocation
    fieldMedia {
      entity {
        ... on MediaImage {
          image {
            alt
            title
            derivative(style: CROP32) {
                url
                width
                height
            }
          }
        }
      }
    }
    fieldLocalHealthCareService {
      entity {
        ... on NodeHealthCareLocalHealthService {
          fieldBody {
            processed
          }
          ${
            enabledFeatureFlags[
              featureFlags.FEATURE_FIELD_REGIONAL_HEALTH_SERVICE
            ]
              ? 'fieldRegionalHealthService'
              : 'fieldClinicalHealthServices'
          } {
            entity {
              ... on NodeRegionalHealthCareServiceDes {
                entityBundle
                fieldBody {
                  processed
                }
                fieldServiceNameAndDescripti {
                  entity {
                    ... on TaxonomyTermHealthCareServiceTaxonomy {
                      entityId
                      entityBundle
                      fieldAlsoKnownAs
                      name
                      description {
                        processed
                      }
                      parent {
                        entity {
                          ...on TaxonomyTermHealthCareServiceTaxonomy {
                            name
                          }
                        }
                      }
                    }
                  }
                }    
              }
            }
          }
        }
      }
    }
  }
`;
