const HOLIDAY_TYPES = {
  REGULAR: 'REGULAR',
  SPECIAL_NON_WORKING: 'SPECIAL_NON_WORKING',
  SPECIAL_WORKING: 'SPECIAL_WORKING',
  ADDITIONAL_SPECIAL: 'ADDITIONAL_SPECIAL'
};

class HolidaysAPI {
  static API_KEY = '2pz6hRcRIlHZUVrw5C23T0YpScl6R6Ju';
  
  static async fetchHolidays(year = new Date().getFullYear()) {
    try {
      const response = await fetch(`https://calendarific.com/api/v2/holidays?api_key=${this.API_KEY}&country=PH&year=${year}`);
      const data = await response.json();
      
      if (data.response && data.response.holidays) {
        return this.formatHolidays(data.response.holidays);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      return [];
    }
  }

  static formatHolidays(holidays) {
    return holidays.map(holiday => {
      // Ensure we get the date in local timezone
      const holidayDate = new Date(holiday.date.iso);
      const localDate = new Date(
        holidayDate.getFullYear(),
        holidayDate.getMonth(),
        holidayDate.getDate()
      ).toISOString().split('T')[0];

      return {
        date: localDate,
        name: holiday.name,
        type: this.determineHolidayType(holiday),
        description: holiday.description
      };
    });
  }

  static determineHolidayType(holiday) {
    if (holiday.type.includes('National')) return HOLIDAY_TYPES.REGULAR;
    if (holiday.type.includes('Special non-working')) return HOLIDAY_TYPES.SPECIAL_NON_WORKING;
    if (holiday.type.includes('Special working')) return HOLIDAY_TYPES.SPECIAL_WORKING;
    return HOLIDAY_TYPES.ADDITIONAL_SPECIAL;
  }

  static async isHoliday(date) {
    try {
      const holidays = await this.fetchHolidays(date.getFullYear());
      // Format the input date consistently
      const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString().split('T')[0];
      return holidays.some(holiday => holiday.date === localDate);
    } catch (error) {
      console.error('Error checking holiday:', error);
      return false;
    }
  }

  static async getHolidayDetails(date) {
    try {
      const holidays = await this.fetchHolidays(date.getFullYear());
      const dateString = date.toISOString().split('T')[0];
      return holidays.find(holiday => holiday.date === dateString);
    } catch (error) {
      console.error('Error getting holiday details:', error);
      return null;
    }
  }
}

export { HolidaysAPI, HOLIDAY_TYPES };
