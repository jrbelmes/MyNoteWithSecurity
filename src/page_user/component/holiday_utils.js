import { HolidaysAPI, HOLIDAY_TYPES } from '../../api/holidaysAPI';

export const fetchHolidays = async (year) => {
  return await HolidaysAPI.fetchHolidays(year);
};

export const isHoliday = async (date) => {
  return await HolidaysAPI.isHoliday(date);
};

export const getHolidayDetails = async (date) => {
  return await HolidaysAPI.getHolidayDetails(date);
};

export const getHolidayStyle = (holidayType) => {
  switch (holidayType) {
    case HOLIDAY_TYPES.REGULAR:
      return {
        backgroundColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        hoverClass: 'cursor-not-allowed'
      };
    case HOLIDAY_TYPES.SPECIAL_NON_WORKING:
      return {
        backgroundColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        hoverClass: 'cursor-not-allowed'
      };
    case HOLIDAY_TYPES.SPECIAL_WORKING:
      return {
        backgroundColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        hoverClass: 'hover:bg-yellow-200'
      };
    case HOLIDAY_TYPES.ADDITIONAL_SPECIAL:
      return {
        backgroundColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        hoverClass: 'cursor-not-allowed'
      };
    default:
      return {
        backgroundColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        hoverClass: ''
      };
  }
};

export { HOLIDAY_TYPES };
