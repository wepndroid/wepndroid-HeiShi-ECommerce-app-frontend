import { catalogApi } from '../api';
import { API_USE_MOCK_FALLBACK } from '../api/config';
import type { FormOptionDto, ListingFormOptionsDto } from '../api/types';
import { MOCK_FORM_OPTIONS } from '../data/formOptionsLocal';

function mergeOptionLists(apiList: FormOptionDto[], mockList: FormOptionDto[]): FormOptionDto[] {
  return apiList.map((item) => {
    const mock = mockList.find((row) => row.key === item.key);
    if (!mock) return item;
    return {
      ...item,
      labelZh: mock.labelZh || item.labelZh,
      labelEn: item.labelEn || mock.labelEn,
    };
  });
}

function mergeFormOptions(api: ListingFormOptionsDto): ListingFormOptionsDto {
  return {
    categories: mergeOptionLists(api.categories, MOCK_FORM_OPTIONS.categories),
    conditions: mergeOptionLists(api.conditions, MOCK_FORM_OPTIONS.conditions),
    pickupMethods: mergeOptionLists(api.pickupMethods, MOCK_FORM_OPTIONS.pickupMethods),
    deliveryMethods: mergeOptionLists(api.deliveryMethods, MOCK_FORM_OPTIONS.deliveryMethods),
    serviceTypes: mergeOptionLists(api.serviceTypes, MOCK_FORM_OPTIONS.serviceTypes),
    serviceAreas: mergeOptionLists(api.serviceAreas, MOCK_FORM_OPTIONS.serviceAreas),
    serviceTimeSlots: mergeOptionLists(api.serviceTimeSlots, MOCK_FORM_OPTIONS.serviceTimeSlots),
  };
}

export async function fetchFormOptions(): Promise<ListingFormOptionsDto> {
  try {
    const api = await catalogApi.getFormOptions();
    return mergeFormOptions(api);
  } catch (error) {
    if (API_USE_MOCK_FALLBACK) {
      return MOCK_FORM_OPTIONS;
    }
    throw error;
  }
}