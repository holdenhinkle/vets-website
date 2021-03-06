/* eslint-disable camelcase */

module.exports = {
  type: 'object',
  properties: {
    uid: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    title: { $ref: 'GenericNestedString' },
    created: { $ref: 'GenericNestedString' },
    changed: { $ref: 'GenericNestedString' },
    promote: { $ref: 'GenericNestedBoolean' },
    metatag: { $ref: 'RawMetaTags' },
    path: { $ref: 'RawPath' },
    field_address: { $ref: 'RawAddress' },
    field_intro_text: { $ref: 'GenericNestedString' },
    field_office: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    field_pdf_version: {
      type: 'array',
      maxItems: 1,
      items: { $ref: 'EntityReference' },
    },
    field_press_release_contact: { $ref: 'EntityReferenceArray' },
    field_press_release_downloads: { $ref: 'EntityReferenceArray' },
    field_press_release_fulltext: { $ref: 'GenericNestedString' },
    field_release_date: { $ref: 'GenericNestedString' },
    // Needed for filtering reverse fields in other transformers
    status: { $ref: 'GenericNestedBoolean' },
  },
  required: [
    'uid',
    'title',
    'created',
    'changed',
    'promote',
    'path',
    'field_address',
    'field_intro_text',
    // Apparently this isn't always here...or maybe never is anymore?
    // 'field_office',
    'field_pdf_version',
    'field_press_release_contact',
    'field_press_release_downloads',
    'field_press_release_fulltext',
    'field_release_date',
    'status',
  ],
};
