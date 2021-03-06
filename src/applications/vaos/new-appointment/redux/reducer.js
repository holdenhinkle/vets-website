/* eslint-disable sonarjs/max-switch-cases */
import { getDefaultFormState } from '@department-of-veterans-affairs/react-jsonschema-form/lib/utils';

import set from 'platform/utilities/data/set';
import unset from 'platform/utilities/data/unset';

import {
  updateSchemaAndData,
  updateItemsSchema,
} from 'platform/forms-system/src/js/state/helpers';

import { getEligibilityChecks, isEligible } from './helpers/eligibility';

import {
  FORM_DATA_UPDATED,
  FORM_PAGE_OPENED,
  FORM_PAGE_CHANGE_STARTED,
  FORM_PAGE_CHANGE_COMPLETED,
  FORM_UPDATE_FACILITY_TYPE,
  FORM_PAGE_FACILITY_OPEN_SUCCEEDED,
  FORM_PAGE_FACILITY_OPEN_FAILED,
  FORM_PAGE_FACILITY_V2_OPEN,
  FORM_PAGE_FACILITY_V2_OPEN_SUCCEEDED,
  FORM_PAGE_FACILITY_V2_OPEN_FAILED,
  FORM_PAGE_FACILITY_SORT_METHOD_UPDATED,
  FORM_PAGE_CC_FACILITY_SORT_METHOD_UPDATED,
  FORM_REQUEST_CURRENT_LOCATION,
  FORM_REQUEST_CURRENT_LOCATION_FAILED,
  FORM_CALENDAR_FETCH_SLOTS,
  FORM_CALENDAR_FETCH_SLOTS_SUCCEEDED,
  FORM_CALENDAR_FETCH_SLOTS_FAILED,
  FORM_CALENDAR_DATA_CHANGED,
  FORM_FETCH_FACILITY_DETAILS,
  FORM_FETCH_FACILITY_DETAILS_SUCCEEDED,
  FORM_FETCH_PARENT_FACILITIES_FAILED,
  FORM_FETCH_CHILD_FACILITIES,
  FORM_FETCH_CHILD_FACILITIES_SUCCEEDED,
  FORM_FETCH_CHILD_FACILITIES_FAILED,
  FORM_VA_PARENT_CHANGED,
  FORM_VA_SYSTEM_UPDATE_CC_ENABLED_SYSTEMS,
  FORM_ELIGIBILITY_CHECKS,
  FORM_ELIGIBILITY_CHECKS_SUCCEEDED,
  FORM_ELIGIBILITY_CHECKS_FAILED,
  FORM_SHOW_ELIGIBILITY_MODAL,
  FORM_HIDE_ELIGIBILITY_MODAL,
  START_DIRECT_SCHEDULE_FLOW,
  START_REQUEST_APPOINTMENT_FLOW,
  FORM_CLINIC_PAGE_OPENED_SUCCEEDED,
  FORM_SHOW_PODIATRY_APPOINTMENT_UNAVAILABLE_MODAL,
  FORM_HIDE_PODIATRY_APPOINTMENT_UNAVAILABLE_MODAL,
  FORM_REASON_FOR_APPOINTMENT_PAGE_OPENED,
  FORM_REASON_FOR_APPOINTMENT_CHANGED,
  FORM_PAGE_COMMUNITY_CARE_PREFS_OPENED,
  FORM_PAGE_COMMUNITY_CARE_PROVIDER_SELECTION_OPENED,
  FORM_SUBMIT,
  FORM_SUBMIT_FAILED,
  FORM_TYPE_OF_CARE_PAGE_OPENED,
  FORM_UPDATE_CC_ELIGIBILITY,
  CLICKED_UPDATE_ADDRESS_BUTTON,
  FORM_REQUESTED_PROVIDERS,
  FORM_REQUESTED_PROVIDERS_SUCCEEDED,
  FORM_REQUESTED_PROVIDERS_FAILED,
} from './actions';

import {
  STARTED_NEW_APPOINTMENT_FLOW,
  FORM_SUBMIT_SUCCEEDED,
} from '../../redux/sitewide';

import {
  FACILITY_SORT_METHODS,
  FACILITY_TYPES,
  FLOW_TYPES,
  FETCH_STATUS,
  PURPOSE_TEXT,
  TYPES_OF_CARE,
  PODIATRY_ID,
} from '../../utils/constants';

import { getTypeOfCare } from './selectors';
import { distanceBetween } from '../../utils/address';
import { getSiteIdFromFakeFHIRId } from '../../services/location';
import { getClinicId } from '../../services/healthcare-service/transformers';

export const REASON_ADDITIONAL_INFO_TITLES = {
  request:
    'Please give us more detail about why you’re making this appointment. This will help us schedule your appointment with the right provider or facility. Please also let us know if you have any scheduling issues, like you can’t have an appointment on a certain day or time.',
  direct:
    'Please provide any additional details you’d like to share with your provider about this appointment.',
};

export const REASON_MAX_CHARS = {
  request: 100,
  direct: 150,
};

const initialState = {
  pages: {},
  data: {},
  facilities: {},
  facilityDetails: {},
  clinics: {},
  eligibility: {},
  parentFacilities: null,
  ccEnabledSystems: null,
  pageChangeInProgress: false,
  previousPages: {},
  childFacilitiesStatus: FETCH_STATUS.notStarted,
  parentFacilitiesStatus: FETCH_STATUS.notStarted,
  eligibilityStatus: FETCH_STATUS.notStarted,
  facilityDetailsStatus: FETCH_STATUS.notStarted,
  pastAppointments: null,
  appointmentSlotsStatus: FETCH_STATUS.notStarted,
  availableSlots: null,
  fetchedAppointmentSlotMonths: [],
  submitStatus: FETCH_STATUS.notStarted,
  isCCEligible: false,
  hideUpdateAddressAlert: false,
  requestLocationStatus: FETCH_STATUS.notStarted,
  communityCareProviders: {},
  requestStatus: FETCH_STATUS.notStarted,
  currentLocation: {},
  ccProviderPageSortMethod: FACILITY_SORT_METHODS.distanceFromResidential,
};

function getFacilities(state, typeOfCareId, vaParent) {
  return state.facilities[`${typeOfCareId}_${vaParent}`] || [];
}

function setupFormData(data, schema, uiSchema) {
  const schemaWithItemsCorrected = updateItemsSchema(schema);
  return updateSchemaAndData(
    schemaWithItemsCorrected,
    uiSchema,
    getDefaultFormState(schemaWithItemsCorrected, data, {}),
  );
}

function updateFacilitiesSchemaAndData(parents, facilities, schema, data) {
  let newSchema = schema;
  let newData = data;

  if (
    facilities.length > 1 ||
    (facilities.length === 1 && parents.length > 1)
  ) {
    newSchema = unset('properties.vaFacilityMessage', newSchema);
    newSchema = set(
      'properties.vaFacility',
      {
        type: 'string',
        enum: facilities.map(facility => facility.id),
        enumNames: facilities.map(
          facility =>
            `${facility.name} (${facility.address?.city}, ${
              facility.address?.state
            })`,
        ),
      },
      newSchema,
    );
  } else if (newData.vaParent) {
    newSchema = unset('properties.vaFacility', newSchema);
    if (!facilities.length) {
      newSchema.properties.vaFacilityMessage = { type: 'string' };
    }
    newData = {
      ...newData,
      vaFacility: facilities[0]?.id,
    };
  }

  return { schema: newSchema, data: newData };
}

export default function formReducer(state = initialState, action) {
  switch (action.type) {
    case FORM_PAGE_OPENED: {
      const { data, schema } = setupFormData(
        state.data,
        action.schema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_DATA_UPDATED: {
      let newPages = state.pages;
      let actionData = action.data;

      if (
        getTypeOfCare(actionData)?.id !== getTypeOfCare(state.data)?.id &&
        (state.pages.vaFacility || state.data.vaFacility)
      ) {
        newPages = unset('vaFacility', newPages);
        actionData = unset('vaFacility', actionData);
      }

      // reset community care provider if type of care changes
      if (
        getTypeOfCare(actionData)?.id !== getTypeOfCare(state.data)?.id &&
        (state.pages.ccPreferences || !!state.data.communityCareProvider?.id)
      ) {
        newPages = unset('ccPreferences', newPages);
        actionData = set('communityCareProvider', {}, actionData);
      }

      const { data, schema } = updateSchemaAndData(
        state.pages[action.page],
        action.uiSchema,
        actionData,
      );

      return {
        ...state,
        data,
        pages: {
          ...newPages,
          [action.page]: schema,
        },
      };
    }
    case STARTED_NEW_APPOINTMENT_FLOW: {
      return {
        ...initialState,
        parentFacilities: state.parentFacilities,
        facilities: state.facilities,
        pastAppointments: state.pastAppointments,
        submitStatus: FETCH_STATUS.notStarted,
        hideUpdateAddressAlert: state.hideUpdateAddressAlert,
      };
    }
    case FORM_PAGE_CHANGE_STARTED: {
      let updatedPreviousPages = state.previousPages;
      if (!Object.keys(updatedPreviousPages).length) {
        updatedPreviousPages = {
          ...updatedPreviousPages,
          [action.pageKey]: 'home',
        };
      }
      return {
        ...state,
        pageChangeInProgress: true,
        previousPages: updatedPreviousPages,
      };
    }
    case FORM_PAGE_CHANGE_COMPLETED: {
      let updatedPreviousPages = state.previousPages;
      if (!Object.keys(updatedPreviousPages).length) {
        updatedPreviousPages = {
          ...updatedPreviousPages,
          [action.pageKey]: 'home',
        };
      }
      if (
        action.direction === 'next' &&
        action.pageKey !== action.pageKeyNext
      ) {
        updatedPreviousPages = {
          ...updatedPreviousPages,
          [action.pageKeyNext]: action.pageKey,
        };
      }
      return {
        ...state,
        pageChangeInProgress: false,
        previousPages: updatedPreviousPages,
      };
    }
    case FORM_TYPE_OF_CARE_PAGE_OPENED: {
      const prefilledData = {
        ...state.data,
        phoneNumber: state.data.phoneNumber || action.phoneNumber,
        email: state.data.email || action.email,
      };

      const sortedCare = TYPES_OF_CARE.filter(
        typeOfCare => typeOfCare.id !== PODIATRY_ID || action.showCommunityCare,
      ).sort(
        (careA, careB) =>
          careA.name.toLowerCase() > careB.name.toLowerCase() ? 1 : -1,
      );
      const initialSchema = {
        ...action.schema,
        properties: {
          typeOfCareId: {
            type: 'string',
            enum: sortedCare.map(care => care.id || care.ccId),
            enumNames: sortedCare.map(care => care.label || care.name),
          },
        },
      };

      const { data, schema } = setupFormData(
        prefilledData,
        initialSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_SHOW_PODIATRY_APPOINTMENT_UNAVAILABLE_MODAL: {
      return {
        ...state,
        showPodiatryAppointmentUnavailableModal: true,
        pageChangeInProgress: false,
      };
    }
    case FORM_HIDE_PODIATRY_APPOINTMENT_UNAVAILABLE_MODAL: {
      return {
        ...state,
        showPodiatryAppointmentUnavailableModal: false,
      };
    }
    case CLICKED_UPDATE_ADDRESS_BUTTON: {
      return {
        ...state,
        hideUpdateAddressAlert: true,
      };
    }
    case FORM_UPDATE_FACILITY_TYPE: {
      return {
        ...state,
        data: { ...state.data, facilityType: action.facilityType },
      };
    }
    case FORM_PAGE_FACILITY_V2_OPEN: {
      return {
        ...state,
        childFacilitiesStatus: FETCH_STATUS.loading,
      };
    }
    case FORM_PAGE_FACILITY_V2_OPEN_SUCCEEDED: {
      let newSchema = action.schema;
      let newData = state.data;
      let facilities = action.facilities;
      const typeOfCareId = action.typeOfCareId;
      const address = action.address;
      const hasResidentialCoordinates =
        !!action.address?.latitude && !!action.address?.longitude;
      const sortMethod = hasResidentialCoordinates
        ? FACILITY_SORT_METHODS.distanceFromResidential
        : FACILITY_SORT_METHODS.alphabetical;

      const parentFacilities =
        action.parentFacilities || state.parentFacilities;

      if (hasResidentialCoordinates && facilities.length) {
        facilities = facilities
          .map(facility => {
            const distanceFromResidentialAddress = distanceBetween(
              address.latitude,
              address.longitude,
              facility.position.latitude,
              facility.position.longitude,
            );

            return {
              ...facility,
              legacyVAR: {
                ...facility.legacyVAR,
                distanceFromResidentialAddress,
              },
            };
          })
          .sort((a, b) => a.legacyVAR[sortMethod] - b.legacyVAR[sortMethod]);
      }

      const typeOfCareFacilities = facilities.filter(
        facility =>
          facility.legacyVAR.directSchedulingSupported[typeOfCareId] ||
          facility.legacyVAR.requestSupported[typeOfCareId],
      );

      if (typeOfCareFacilities.length === 1) {
        newData = {
          ...newData,
          vaFacility: typeOfCareFacilities[0]?.id,
        };
      }

      newSchema = set(
        'properties.vaFacility',
        {
          type: 'string',
          enum: typeOfCareFacilities.map(facility => facility.id),
          enumNames: typeOfCareFacilities,
        },
        newSchema,
      );

      const { data, schema } = setupFormData(
        newData,
        newSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          vaFacilityV2: schema,
        },
        facilities: {
          ...state.facilities,
          [typeOfCareId]: facilities,
        },
        parentFacilities,
        childFacilitiesStatus: FETCH_STATUS.succeeded,
        facilityPageSortMethod: sortMethod,
        showEligibilityModal: false,
      };
    }
    case FORM_REQUEST_CURRENT_LOCATION: {
      return {
        ...state,
        requestLocationStatus: FETCH_STATUS.loading,
      };
    }
    case FORM_PAGE_CC_FACILITY_SORT_METHOD_UPDATED: {
      let requestLocationStatus = state.requestLocationStatus;

      requestLocationStatus = FETCH_STATUS.succeeded;

      if (
        action.sortMethod === FACILITY_SORT_METHODS.distanceFromCurrentLocation
      ) {
        return {
          ...state,
          currentLocation: {
            latitude: action.location?.coords.latitude,
            longitude: action.location?.coords.longitude,
          },
          ccProviderPageSortMethod: action.sortMethod,
          requestLocationStatus,
        };
      } else {
        return {
          ...state,
          ccProviderPageSortMethod: action.sortMethod,
        };
      }
    }

    case FORM_PAGE_FACILITY_SORT_METHOD_UPDATED: {
      const formData = state.data;
      const typeOfCareId = getTypeOfCare(formData).id;
      const sortMethod = action.sortMethod;
      const location = action.location;
      let facilities = state.facilities[typeOfCareId];
      let newSchema = state.pages.vaFacilityV2;
      let requestLocationStatus = state.requestLocationStatus;

      if (location && facilities?.length) {
        const { coords } = location;
        const { latitude, longitude } = coords;

        if (latitude && longitude) {
          facilities = facilities.map(facility => {
            const distanceFromCurrentLocation = distanceBetween(
              latitude,
              longitude,
              facility.position.latitude,
              facility.position.longitude,
            );

            return {
              ...facility,
              legacyVAR: {
                ...facility.legacyVAR,
                distanceFromCurrentLocation,
              },
            };
          });
        }

        requestLocationStatus = FETCH_STATUS.succeeded;
      }

      if (sortMethod === FACILITY_SORT_METHODS.alphabetical) {
        facilities = facilities.sort((a, b) => a.name - b.name);
      } else {
        facilities = facilities.sort(
          (a, b) => a.legacyVAR[sortMethod] - b.legacyVAR[sortMethod],
        );
      }

      const typeOfCareFacilities = facilities.filter(
        facility =>
          facility.legacyVAR.directSchedulingSupported[typeOfCareId] ||
          facility.legacyVAR.requestSupported[typeOfCareId],
      );
      newSchema = set(
        'properties.vaFacility',
        {
          type: 'string',
          enum: typeOfCareFacilities.map(facility => facility.id),
          enumNames: typeOfCareFacilities,
        },
        newSchema,
      );

      const { schema } = updateSchemaAndData(
        newSchema,
        action.uiSchema,
        formData,
      );

      return {
        ...state,
        pages: {
          ...state.pages,
          vaFacilityV2: schema,
        },
        facilities: {
          ...state.facilities,
          [typeOfCareId]: facilities,
        },
        childFacilitiesStatus: FETCH_STATUS.succeeded,
        facilityPageSortMethod: sortMethod,
        requestLocationStatus,
      };
    }
    case FORM_REQUEST_CURRENT_LOCATION_FAILED: {
      return {
        ...state,
        requestLocationStatus: FETCH_STATUS.failed,
      };
    }
    case FORM_PAGE_FACILITY_OPEN_SUCCEEDED: {
      let newSchema = action.schema;
      let newData = state.data;
      const parentFacilities =
        action.parentFacilities || state.parentFacilities;

      // For both parents and facilities, we want to put them in the form
      // schema as radio options if we have more than one to choose from.
      // If we only have one, then we want to just set the value in the
      // form data and remove the schema for that field, so we don't
      // show the question to the user
      if (parentFacilities.length > 1 || action.isCernerOnly) {
        newSchema = set(
          'properties.vaParent.enum',
          parentFacilities.map(sys => sys.id),
          action.schema,
        );
        newSchema = set(
          'properties.vaParent.enumNames',
          parentFacilities.map(sys => sys.name),
          newSchema,
        );

        // Remove validation so that Cerner only patients can click
        // on the Continue button and go to the Cerner portal
        if (action.isCernerOnly) {
          delete newSchema.required;
        }
      } else {
        newSchema = unset('properties.vaParent', newSchema);
        newData = {
          ...newData,
          vaParent: parentFacilities[0]?.id,
        };
      }

      const facilities =
        action.facilities ||
        getFacilities(state, action.typeOfCareId, newData.vaParent);

      const facilityUpdate = updateFacilitiesSchemaAndData(
        parentFacilities,
        facilities,
        newSchema,
        newData,
      );

      const { data, schema } = setupFormData(
        facilityUpdate.data,
        facilityUpdate.schema,
        action.uiSchema,
      );

      let eligibility = state.eligibility;
      let clinics = state.clinics;
      let pastAppointments = state.pastAppointments;

      if (action.eligibilityData) {
        const facilityEligibility = getEligibilityChecks(
          action.eligibilityData,
        );

        eligibility = {
          ...state.eligibility,
          [`${data.vaFacility}_${action.typeOfCareId}`]: facilityEligibility,
        };

        if (!action.eligibilityData.clinics?.directFailed) {
          clinics = {
            ...state.clinics,
            [`${data.vaFacility}_${action.typeOfCareId}`]: action
              .eligibilityData.clinics,
          };

          pastAppointments = action.eligibilityData.pastAppointments;
        }
      }

      return {
        ...state,
        parentFacilities,
        data,
        parentFacilitiesStatus: FETCH_STATUS.succeeded,
        facilities: {
          ...state.facilities,
          [`${action.typeOfCareId}_${newData.vaParent}`]: facilities,
        },
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
        eligibility,
        clinics,
        pastAppointments,
      };
    }
    case FORM_FETCH_PARENT_FACILITIES_FAILED:
    case FORM_PAGE_FACILITY_OPEN_FAILED: {
      return {
        ...state,
        parentFacilitiesStatus: FETCH_STATUS.failed,
      };
    }
    case FORM_FETCH_CHILD_FACILITIES: {
      let newState = unset('pages.vaFacility.properties.vaFacility', state);
      newState = unset(
        'pages.vaFacility.properties.vaFacilityMessage',
        newState,
      );
      newState = set(
        'pages.vaFacility.properties.vaFacilityLoading',
        { type: 'string' },
        newState,
      );

      return { ...newState, childFacilitiesStatus: FETCH_STATUS.loading };
    }
    case FORM_FETCH_CHILD_FACILITIES_SUCCEEDED: {
      const facilityUpdate = updateFacilitiesSchemaAndData(
        state.parentFacilities,
        action.facilities,
        state.pages.vaFacility,
        state.data,
      );

      const newData = facilityUpdate.data;
      const newSchema = unset(
        'properties.vaFacilityLoading',
        facilityUpdate.schema,
      );

      const { data, schema } = updateSchemaAndData(
        newSchema,
        action.uiSchema,
        newData,
      );

      return {
        ...state,
        data,
        facilities: {
          ...state.facilities,
          [`${action.typeOfCareId}_${newData.vaParent}`]: action.facilities,
        },
        pages: {
          ...state.pages,
          vaFacility: schema,
        },
        childFacilitiesStatus: FETCH_STATUS.succeeded,
      };
    }
    case FORM_PAGE_FACILITY_V2_OPEN_FAILED:
    case FORM_FETCH_CHILD_FACILITIES_FAILED: {
      const pages = unset(
        'vaFacility.properties.vaFacilityLoading',
        state.pages,
      );

      return {
        ...state,
        pages,
        childFacilitiesStatus: FETCH_STATUS.failed,
      };
    }
    case FORM_VA_PARENT_CHANGED: {
      const facilityUpdate = updateFacilitiesSchemaAndData(
        state.parentFacilities,
        getFacilities(state, action.typeOfCareId, state.data.vaParent),
        state.pages.vaFacility,
        state.data,
      );

      const { data, schema } = updateSchemaAndData(
        facilityUpdate.schema,
        action.uiSchema,
        facilityUpdate.data,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          vaFacility: schema,
        },
      };
    }
    case FORM_VA_SYSTEM_UPDATE_CC_ENABLED_SYSTEMS: {
      return {
        ...state,
        ccEnabledSystems: action.ccEnabledSystems,
        parentFacilities: action.parentFacilities,
        parentFacilitiesStatus: FETCH_STATUS.succeeded,
      };
    }
    case FORM_ELIGIBILITY_CHECKS: {
      return {
        ...state,
        eligibilityStatus: FETCH_STATUS.loading,
      };
    }
    case FORM_ELIGIBILITY_CHECKS_SUCCEEDED: {
      const eligibility = getEligibilityChecks(action.eligibilityData);
      const canSchedule = isEligible(eligibility);
      const facilityId = action.facilityId || state.data.vaFacility;

      let clinics = state.clinics;

      if (!action.eligibilityData.clinics?.directFailed) {
        clinics = {
          ...state.clinics,
          [`${facilityId}_${action.typeOfCareId}`]: action.eligibilityData
            .clinics,
        };
      }

      return {
        ...state,
        clinics,
        eligibility: {
          ...state.eligibility,
          [`${facilityId}_${action.typeOfCareId}`]: eligibility,
        },
        eligibilityStatus: FETCH_STATUS.succeeded,
        pastAppointments: action.eligibilityData.pastAppointments,
        showEligibilityModal:
          action.showModal && !canSchedule.direct && !canSchedule.request,
      };
    }
    case FORM_ELIGIBILITY_CHECKS_FAILED: {
      return {
        ...state,
        eligibilityStatus: FETCH_STATUS.failed,
      };
    }
    case FORM_SHOW_ELIGIBILITY_MODAL: {
      return {
        ...state,
        showEligibilityModal: true,
      };
    }
    case FORM_HIDE_ELIGIBILITY_MODAL: {
      return {
        ...state,
        showEligibilityModal: false,
      };
    }
    case START_DIRECT_SCHEDULE_FLOW:
      return {
        ...state,
        data: {
          ...state.data,
          selectedDates: [],
        },
        flowType: FLOW_TYPES.DIRECT,
      };
    case START_REQUEST_APPOINTMENT_FLOW:
      return {
        ...state,
        data: {
          ...state.data,
          selectedDates: [],
        },
        flowType: FLOW_TYPES.REQUEST,
      };
    case FORM_FETCH_FACILITY_DETAILS:
      return {
        ...state,
        facilityDetailsStatus: FETCH_STATUS.loading,
      };
    case FORM_FETCH_FACILITY_DETAILS_SUCCEEDED:
      return {
        ...state,
        facilityDetailsStatus: FETCH_STATUS.succeeded,
        facilityDetails: {
          ...state.facilityDetails,
          [action.facilityId]: action.facilityDetails,
        },
      };
    case FORM_CALENDAR_FETCH_SLOTS: {
      return {
        ...state,
        appointmentSlotsStatus: FETCH_STATUS.loading,
      };
    }
    case FORM_CALENDAR_FETCH_SLOTS_SUCCEEDED: {
      return {
        ...state,
        appointmentSlotsStatus: FETCH_STATUS.succeeded,
        availableSlots: action.availableSlots,
        fetchedAppointmentSlotMonths: action.fetchedAppointmentSlotMonths,
      };
    }
    case FORM_CALENDAR_FETCH_SLOTS_FAILED: {
      return {
        ...state,
        appointmentSlotsStatus: FETCH_STATUS.failed,
      };
    }
    case FORM_CALENDAR_DATA_CHANGED: {
      return {
        ...state,
        data: {
          ...state.data,
          selectedDates: action.selectedDates,
        },
      };
    }
    case FORM_REASON_FOR_APPOINTMENT_PAGE_OPENED: {
      const formData = state.data;
      let reasonMaxChars = REASON_MAX_CHARS.request;

      if (state.flowType === FLOW_TYPES.DIRECT) {
        const prependText = PURPOSE_TEXT.find(
          purpose => purpose.id === formData.reasonForAppointment,
        )?.short;
        reasonMaxChars =
          REASON_MAX_CHARS.direct - (prependText?.length || 0) - 2;
      }

      let reasonSchema = set(
        'properties.reasonAdditionalInfo.maxLength',
        reasonMaxChars,
        action.schema,
      );

      if (formData.facilityType !== FACILITY_TYPES.COMMUNITY_CARE) {
        const additionalInfoTitle =
          state.flowType === FLOW_TYPES.DIRECT
            ? REASON_ADDITIONAL_INFO_TITLES.direct
            : REASON_ADDITIONAL_INFO_TITLES.request;

        reasonSchema = set(
          'properties.reasonAdditionalInfo.title',
          additionalInfoTitle,
          reasonSchema,
        );
      } else {
        delete formData.reasonForAppointment;
      }

      const { data, schema } = setupFormData(
        formData,
        reasonSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_REASON_FOR_APPOINTMENT_CHANGED: {
      let newSchema = state.pages.reasonForAppointment;

      if (state.flowType === FLOW_TYPES.DIRECT) {
        const prependText = PURPOSE_TEXT.find(
          purpose => purpose.id === action.data.reasonForAppointment,
        )?.short;
        newSchema = set(
          'properties.reasonAdditionalInfo.maxLength',
          REASON_MAX_CHARS.direct - (prependText?.length || 0) - 2,
          newSchema,
        );
      }

      const { data, schema } = updateSchemaAndData(
        newSchema,
        action.uiSchema,
        action.data,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          reasonForAppointment: schema,
        },
      };
    }
    case FORM_CLINIC_PAGE_OPENED_SUCCEEDED: {
      let newSchema = action.schema;
      let clinics =
        state.clinics[
          `${state.data.vaFacility}_${getTypeOfCare(state.data).id}`
        ];

      if (state.pastAppointments) {
        const pastAppointmentDateMap = new Map();
        const siteId = getSiteIdFromFakeFHIRId(state.data.vaFacility);

        state.pastAppointments.forEach(appt => {
          const apptTime = appt.startDate;
          const latestApptTime = pastAppointmentDateMap.get(appt.clinicId);
          if (
            // Remove parse function when converting the past appointment call to FHIR service
            appt.facilityId === siteId &&
            (!latestApptTime || latestApptTime > apptTime)
          ) {
            pastAppointmentDateMap.set(appt.clinicId, apptTime);
          }
        });

        clinics = clinics.filter(clinic =>
          // Get clinic portion of id
          pastAppointmentDateMap.has(getClinicId(clinic)),
        );
      }

      if (clinics.length === 1) {
        const clinic = clinics[0];
        newSchema = {
          ...newSchema,
          properties: {
            clinicId: {
              type: 'string',
              title: `Would you like to make an appointment at ${
                clinic.serviceName
              }?`,
              enum: [clinic.id, 'NONE'],
              enumNames: [
                'Yes, make my appointment here',
                'No, I need a different clinic',
              ],
            },
          },
        };
      } else {
        newSchema = {
          ...newSchema,
          properties: {
            clinicId: {
              type: 'string',
              title:
                'You can choose a clinic where you’ve been seen or request an appointment at a different clinic.',
              enum: clinics.map(clinic => clinic.id).concat('NONE'),
              enumNames: clinics
                .map(clinic => clinic.serviceName)
                .concat('I need a different clinic'),
            },
          },
        };
      }

      const { data, schema } = setupFormData(
        state.data,
        newSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data: {
          ...data,
          selectedDates: [],
        },
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_PAGE_COMMUNITY_CARE_PREFS_OPENED: {
      let formData = state.data;
      const typeOfCare = getTypeOfCare(formData);
      let initialSchema = set(
        'properties.hasCommunityCareProvider.title',
        `Do you have a preferred VA-approved community care provider for this ${
          typeOfCare.name
        } appointment?`,
        action.schema,
      );

      if (state.ccEnabledSystems?.length === 1) {
        formData = {
          ...formData,
          communityCareSystemId: state.ccEnabledSystems[0].id,
        };
        initialSchema = unset(
          'properties.communityCareSystemId',
          initialSchema,
        );
      } else {
        initialSchema = set(
          'properties.communityCareSystemId.enum',
          state.ccEnabledSystems.map(system => system.id),
          initialSchema,
        );
        initialSchema.properties.communityCareSystemId.enumNames = state.ccEnabledSystems.map(
          system =>
            `${system.address?.[0]?.city}, ${system.address?.[0]?.state}`,
        );
        initialSchema.required.push('communityCareSystemId');
      }
      const { data, schema } = setupFormData(
        formData,
        initialSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_PAGE_COMMUNITY_CARE_PROVIDER_SELECTION_OPENED: {
      let formData = state.data;
      const typeOfCare = getTypeOfCare(formData);
      let initialSchema = set(
        'properties.communityCareProvider.title',
        `Request a ${typeOfCare.name} provider. (Optional)`,
        action.schema,
      );

      if (state.ccEnabledSystems?.length === 1) {
        formData = {
          ...formData,
          communityCareSystemId: state.ccEnabledSystems[0].id,
        };
        initialSchema = unset(
          'properties.communityCareSystemId',
          initialSchema,
        );
      } else {
        initialSchema = set(
          'properties.communityCareSystemId.enum',
          state.ccEnabledSystems.map(system => system.id),
          initialSchema,
        );
        initialSchema.properties.communityCareSystemId.enumNames = state.ccEnabledSystems.map(
          system =>
            `${system.address?.[0]?.city}, ${system.address?.[0]?.state}`,
        );
        initialSchema.required = ['communityCareSystemId'];
      }
      const { data, schema } = setupFormData(
        formData,
        initialSchema,
        action.uiSchema,
      );

      return {
        ...state,
        data,
        pages: {
          ...state.pages,
          [action.page]: schema,
        },
      };
    }
    case FORM_SUBMIT:
      return {
        ...state,
        submitStatus: FETCH_STATUS.loading,
      };
    case FORM_SUBMIT_SUCCEEDED:
      return {
        ...state,
        submitStatus: FETCH_STATUS.succeeded,
        submitStatusVaos400: false,
      };
    case FORM_SUBMIT_FAILED:
      return {
        ...state,
        submitStatus: FETCH_STATUS.failed,
        submitStatusVaos400: action.isVaos400Error,
      };
    case FORM_UPDATE_CC_ELIGIBILITY: {
      return {
        ...state,
        isCCEligible: action.isEligible,
      };
    }
    case FORM_REQUESTED_PROVIDERS: {
      return {
        ...state,
        requestStatus: FETCH_STATUS.loading,
      };
    }
    case FORM_REQUESTED_PROVIDERS_SUCCEEDED: {
      const { address, typeOfCareProviders } = action;
      const { ccProviderPageSortMethod: sortMethod, data } = state;
      const cacheKey = `${sortMethod}_${getTypeOfCare(data)?.ccId}`;

      const providers =
        state.communityCareProviders[cacheKey] ||
        typeOfCareProviders
          .map(facility => {
            const distance = distanceBetween(
              address.latitude,
              address.longitude,
              facility.position.latitude,
              facility.position.longitude,
            );
            return {
              ...facility,
              [sortMethod]: distance,
            };
          })
          .sort((a, b) => a[sortMethod] - b[sortMethod]);

      return {
        ...state,
        requestStatus: FETCH_STATUS.succeeded,
        communityCareProviders: {
          ...state.communityCareProviders,
          [cacheKey]: providers,
        },
      };
    }
    case FORM_REQUESTED_PROVIDERS_FAILED: {
      return {
        ...state,
        requestStatus: FETCH_STATUS.failed,
      };
    }
    default:
      return state;
  }
}
