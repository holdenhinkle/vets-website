/* eslint-disable camelcase */

module.exports = {
  type: 'object',
  properties: {
    title: { $ref: 'GenericNestedString' },
    changed: {
      type: 'array',
      maxItems: 1,
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          format: { type: 'string' },
        },
        required: ['value', 'format'],
      },
    },
    path: { $ref: 'RawPath' },
    field_administration: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    field_alert: { type: 'array' },
    field_home_page_hub_label: { $ref: 'GenericNestedString' },
    field_intro_text: { $ref: 'GenericNestedString' },
    // This is essentially a list of paragraph-link_teaser,
    // but only containing the data in field_link
    field_links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uri: { type: 'string' },
          title: { type: 'string' },
          options: { type: 'array' },
        },
        required: ['uri', 'title', 'options'],
      },
    },
    field_page_last_built: { $ref: 'GenericNestedString' },
    field_plainlanguage_date: {
      type: 'array',
      // maxItems: 0 until we know what the items look like
      maxItems: 0,
    },
    field_promo: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    field_related_links: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    field_spokes: { $ref: 'EntityReferenceArray' },
    field_support_services: { $ref: 'EntityReferenceArray' },
    field_title_icon: { $ref: 'GenericNestedString' },
    metatag: { $ref: 'RawMetaTags' },
    status: { $ref: 'GenericNestedBoolean' },
  },
  required: [
    'title',
    'changed',
    'path',
    'field_administration',
    'field_alert',
    'field_home_page_hub_label',
    'field_intro_text',
    'field_links',
    'field_page_last_built',
    'field_plainlanguage_date',
    'field_promo',
    'field_related_links',
    'field_spokes',
    'field_support_services',
    'field_title_icon',
    'metatag',
    'status',
  ],
};
