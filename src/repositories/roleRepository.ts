import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { Role, RoleName } from '../entities/role';
import { sqlClient, SqlClient, ResultRow } from '../clients/sqlClient';
import { flow, pipe } from 'fp-ts/function';

export interface RoleRepository {
  findAllRoles(): TE.TaskEither<Error, Array<Role>>
  findRoleByRoleName(roleName: RoleName): TE.TaskEither<Error, O.Option<Role>>
}

class DefaultRoleRepository implements RoleRepository {
  constructor(
    readonly sqlClient: SqlClient
  ) { }

  findAllRoles(): TE.TaskEither<Error, Array<Role>> {
    return pipe(
      sqlClient.query('SELECT * FROM roles'),
      TE.map(resultSet => resultSet.rows),
      TE.map(flow(A.map(resultRowToOptionRole), A.compact))
    )
  }
  findRoleByRoleName(roleName: RoleName): TE.TaskEither<Error, O.Option<Role>> {
    return pipe(
      sqlClient.querySingleWithParamsO(
        'SELECT * FROM roles WHERE role_name = $1', [roleName]
      ),
      TE.map(O.chain(resultRowToOptionRole))
    )
  }
}

function resultRowToOptionRole(rr: ResultRow): O.Option<Role> {
  return O.fromEither(Role.decode({
    roleId: rr.role_id,
    roleName: rr.role_name,
    roleDescription: rr.role_description,
    createdAt: rr.created_at
  }));
}

export const roleRepository = new DefaultRoleRepository(sqlClient);
