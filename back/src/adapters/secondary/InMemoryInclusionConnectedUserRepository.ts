import {
  AgencyRight,
  AuthenticatedUserId,
  InclusionConnectedUser,
} from "shared";
import { InclusionConnectedUserRepository } from "../../domain/dashboard/port/InclusionConnectedUserRepository";
import { InMemoryAuthenticatedUserRepository } from "./InMemoryAuthenticatedUserRepository";

type AgencyRightsByUserId = Record<AuthenticatedUserId, AgencyRight[]>;

export class InMemoryInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(
    private authenticatedUsersRepository: InMemoryAuthenticatedUserRepository,
  ) {}

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const user = await this.authenticatedUsersRepository.users.find(
      (user) => user.id === userId,
    );
    if (!user) return;
    return { ...user, agencyRights: this.agenciesByUserId[userId] ?? [] };
  }

  async update(user: InclusionConnectedUser): Promise<void> {
    this.agenciesByUserId[user.id] = user.agencyRights;
  }

  public agenciesByUserId: AgencyRightsByUserId = {};

  setInclusionConnectedUsers(
    inclusionConnectedUsers: InclusionConnectedUser[],
  ) {
    this.authenticatedUsersRepository.users = inclusionConnectedUsers.map(
      ({ agencyRights, ...user }) => user,
    );
    this.agenciesByUserId = inclusionConnectedUsers.reduce(
      (acc, icUser) => ({
        ...acc,
        [icUser.id]: icUser.agencyRights,
      }),
      {} satisfies AgencyRightsByUserId,
    );
  }
}
