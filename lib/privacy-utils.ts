export interface PrivacySettings {
  show_email?: boolean
  show_phone?: boolean
  show_birthday?: boolean
  show_birth_country?: boolean
  show_current_country?: boolean
  show_languages?: boolean
  show_preferred_language?: boolean
  show_journey_stage?: boolean
  show_estimated_move_in_date?: boolean
  show_profile_picture?: boolean
  show_neighborhood?: boolean
  show_family?: boolean
  show_family_relationships?: boolean
  show_interests?: boolean
  show_skills?: boolean
  show_open_to_requests?: boolean
}

export interface UserWithPrivacy {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  birthday?: string | null
  birth_country?: string | null
  current_country?: string | null
  languages?: string[] | null
  preferred_language?: string | null
  journey_stage?: string | null
  estimated_move_in_date?: string | null
  profile_picture_url?: string | null
  lot_id?: string | null
  family_unit_id?: string | null
  user_privacy_settings?: PrivacySettings[] | null
  [key: string]: any
}

/**
 * Filters user data based on privacy settings
 * @param user - The user object to filter
 * @param viewerId - The ID of the user viewing the data
 * @param isFamilyMember - Whether the viewer is a family member (bypasses privacy)
 * @returns Filtered user object with privacy settings applied
 */
export function applyPrivacyFilter(user: UserWithPrivacy, viewerId: string, isFamilyMember = false): UserWithPrivacy {
  // User viewing their own profile - show everything
  if (user.id === viewerId) {
    return user
  }

  // Family members see everything
  if (isFamilyMember) {
    return user
  }

  // Get privacy settings (first element if array, or use as object)
  const privacySettings = Array.isArray(user.user_privacy_settings)
    ? user.user_privacy_settings[0]
    : user.user_privacy_settings

  // If no privacy settings, default to showing everything
  if (!privacySettings) {
    return user
  }

  // Create filtered user object
  const filteredUser = { ...user }

  // Apply privacy filters
  if (privacySettings.show_email === false) {
    filteredUser.email = null
  }
  if (privacySettings.show_phone === false) {
    filteredUser.phone = null
  }
  if (privacySettings.show_birthday === false) {
    filteredUser.birthday = null
  }
  if (privacySettings.show_birth_country === false) {
    filteredUser.birth_country = null
  }
  if (privacySettings.show_current_country === false) {
    filteredUser.current_country = null
  }
  if (privacySettings.show_languages === false) {
    filteredUser.languages = null
  }
  if (privacySettings.show_preferred_language === false) {
    filteredUser.preferred_language = null
  }
  if (privacySettings.show_journey_stage === false) {
    filteredUser.journey_stage = null
  }
  if (privacySettings.show_estimated_move_in_date === false) {
    filteredUser.estimated_move_in_date = null
  }
  if (privacySettings.show_profile_picture === false) {
    filteredUser.profile_picture_url = null
  }
  if (privacySettings.show_interests === false) {
    filteredUser.user_interests = []
  }
  if (privacySettings.show_skills === false) {
    filteredUser.user_skills = []
  }

  // Name and lot are always visible (as per requirements)
  return filteredUser
}

/**
 * Filters user data based on privacy settings
 * @param user - The user object to filter
 * @param privacySettings - The privacy settings object
 * @param isFamilyMember - Whether the viewer is a family member (bypasses privacy)
 * @returns Filtered user object with privacy settings applied
 */
export function filterPrivateData(
  user: UserWithPrivacy,
  privacySettings: PrivacySettings | null | undefined,
  isFamilyMember = false,
): UserWithPrivacy {
  // Family members see everything
  if (isFamilyMember) {
    return user
  }

  // If no privacy settings, default to showing everything
  if (!privacySettings) {
    return user
  }

  // Create filtered user object
  const filteredUser = { ...user }

  // Apply privacy filters
  if (privacySettings.show_email === false) {
    filteredUser.email = null
  }
  if (privacySettings.show_phone === false) {
    filteredUser.phone = null
  }
  if (privacySettings.show_birthday === false) {
    filteredUser.birthday = null
  }
  if (privacySettings.show_birth_country === false) {
    filteredUser.birth_country = null
  }
  if (privacySettings.show_current_country === false) {
    filteredUser.current_country = null
  }
  if (privacySettings.show_languages === false) {
    filteredUser.languages = null
  }
  if (privacySettings.show_preferred_language === false) {
    filteredUser.preferred_language = null
  }
  if (privacySettings.show_journey_stage === false) {
    filteredUser.journey_stage = null
  }
  if (privacySettings.show_estimated_move_in_date === false) {
    filteredUser.estimated_move_in_date = null
  }
  if (privacySettings.show_profile_picture === false) {
    filteredUser.profile_picture_url = null
  }
  if (privacySettings.show_interests === false) {
    filteredUser.user_interests = []
  }
  if (privacySettings.show_skills === false) {
    filteredUser.user_skills = []
  }

  return filteredUser
}

/**
 * Checks if two users are family members
 */
export function areFamilyMembers(user1FamilyUnitId: string | null, user2FamilyUnitId: string | null): boolean {
  if (!user1FamilyUnitId || !user2FamilyUnitId) {
    return false
  }
  return user1FamilyUnitId === user2FamilyUnitId
}
