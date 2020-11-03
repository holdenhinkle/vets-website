module.exports = {
  type: 'object',
  properties: {
    contentModelType: { enum: ['taxonomy_term-health_care_service_taxonomy'] },
    entity: {
      type: 'object',
      properties: {
        entityType: { enum: ['taxonomy_term'] },
        entityBundle: { enum: ['health_care_service_taxonomy'] },
        name: { type: 'string' },
        description: { $ref: 'ProcessedString' },
        parent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  weight: { type: ['number', 'null'] },
                },
                required: ['name', 'weight'],
              },
            },
            required: ['entity'],
          },
          maxItems: 1,
        },
        fieldAlsoKnownAs: { type: ['string', 'null'] },
        fieldCommonlyTreatedCondition: { type: ['string', 'null'] },
        fieldHealthServiceApiId: { type: ['string', 'null'] },
        weight: { type: ['number', 'null'] },
      },
      required: [
        'name',
        'description',
        'parent',
        'fieldAlsoKnownAs',
        'fieldCommonlyTreatedCondition',
        'fieldHealthServiceApiId',
        'weight',
      ],
    },
  },
  required: ['entity'],
};
