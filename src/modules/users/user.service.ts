import { User } from "./user.model";
import { Profile } from "../profiles/profile.model";

/**
 * Common include for User with Profile
 */
export const userWithProfileInclude = {
    model: User,
    as: 'user',
    include: [
        {
            model: Profile,
            as: 'profile'
        }
    ],
    attributes: { exclude: ['password'] }
};

/**
 * Get full user data including profile
 * @param userId User ID
 * @returns User with profile or null
 */
export const getUserFullData = async (userId: number) => {
    return await User.findByPk(userId, {
        include: userWithProfileInclude.include,
        attributes: userWithProfileInclude.attributes
    });
};
