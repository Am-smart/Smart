import { withHandler } from '@/app/api/api-utils';
import { UserMapper } from '@/lib/mappers';

export const GET = withHandler(async (user) => {
    return UserMapper.toDTO(user);
});
