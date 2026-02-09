import { describe, it, expect } from "vitest"
import { applyPrivacyFilter, filterPrivateData, UserWithPrivacy, PrivacySettings } from "./privacy-utils"

describe("privacy-utils", () => {
    const mockPrivacySettings: PrivacySettings = {
        show_email: false,
        show_phone: false,
        show_birthday: true,
        show_neighborhood: false,
        show_family: true,
    }

    const mockUser: UserWithPrivacy = {
        id: "user-1",
        email: "test@example.com",
        phone: "123-456-7890",
        birthday: "1990-01-01",
        lot_id: "lot-1",
        family_unit_id: "family-1",
        user_privacy_settings: [mockPrivacySettings],
        first_name: "Test",
        last_name: "User",
    }

    const viewerId = "viewer-1"

    describe("applyPrivacyFilter", () => {
        it("should hide private fields for standard viewer", () => {
            // @ts-ignore - isTenantAdmin arg not yet implemented in source, but test expects it
            const result = applyPrivacyFilter(mockUser, viewerId, false, false) // isFamilyMember=false, isTenantAdmin=false

            expect(result.email).toBeNull()
            expect(result.phone).toBeNull()
            expect(result.birthday).toBe("1990-01-01") // clear setting is true
        })

        it("should show all fields for family member", () => {
            // @ts-ignore
            const result = applyPrivacyFilter(mockUser, viewerId, true, false) // isFamilyMember=true

            expect(result.email).toBe("test@example.com")
            expect(result.phone).toBe("123-456-7890")
        })

        it("should show all fields for self view", () => {
            // @ts-ignore
            const result = applyPrivacyFilter(mockUser, "user-1", false, false) // viewerId = user.id

            expect(result.email).toBe("test@example.com")
        })

        it("should show all fields for tenant admin", () => {
            // @ts-ignore
            const result = applyPrivacyFilter(mockUser, viewerId, false, true) // isTenantAdmin=true

            expect(result.email).toBe("test@example.com")
            expect(result.phone).toBe("123-456-7890")
        })
    })

    describe("filterPrivateData", () => {
        it("should mark fields as hidden (show_X = false) for standard viewer", () => {
            // @ts-ignore
            const result = filterPrivateData(mockUser, mockPrivacySettings, false, false) // isFamilyMember=false, isTenantAdmin=false

            expect(result.email).toBeNull()
            expect(result.show_email).toBe(false)
            expect(result.phone).toBeNull()
            expect(result.show_phone).toBe(false)
            expect(result.birthday).toBe("1990-01-01")
            expect(result.show_birthday).toBe(true)
        })

        it("should mark fields as visible (show_X = true) for tenant admin", () => {
            // @ts-ignore
            const result = filterPrivateData(mockUser, mockPrivacySettings, false, true) // isTenantAdmin=true

            expect(result.email).toBe("test@example.com")
            expect(result.show_email).toBe(true)
            expect(result.phone).toBe("123-456-7890")
            expect(result.show_phone).toBe(true)
        })
    })
})
