/** Days in a week view (Mon–Sun). */
export const WEEK_LENGTH = 7;

/** Days in the three-day view (anchor −1 … anchor +1). */
export const THREE_DAY_LENGTH = 3;

/** Navigation step per view mode (must match visible column count). */
export const VIEW_MODE_NAV_STEP = {
    day: 1,
    threeDay: 3,
    week: 7,
} as const;

/** Days loaded before the anchor when the calendar mounts. */
export const INITIAL_PAST_DAYS = 7;

/** Days loaded after the anchor when the calendar mounts. */
export const INITIAL_FUTURE_DAYS = 28;
