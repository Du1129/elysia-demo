import type { UserModel } from './model'

const now = new Date('2026-07-07T00:00:00.000Z')
let nextUserId = 2

const users: UserModel.UserRecord[] = [
  {
    id: 1,
    parentId: null,
    name: 'July',
    phone: '13800000000',
    email: 'july@example.com',
    password: 'password',
    description: null,
    status: 1,
    avatarImgKey: null,
    createdAt: now,
    updatedAt: now
  }
]

const toPublicUser = ({ password: _password, ...user }: UserModel.UserRecord): UserModel.User => user

export abstract class UserService {
  static list() {
    return users.map(toPublicUser)
  }

  static findById(id: number) {
    const user = users.find((user) => user.id === id)

    return user ? toPublicUser(user) : undefined
  }

  static create(input: UserModel.CreateBody) {
    const now = new Date()
    const user = {
      id: nextUserId++,
      ...input,
      parentId: input.parentId ?? null,
      description: input.description ?? null,
      status: input.status ?? 1,
      avatarImgKey: input.avatarImgKey ?? null,
      createdAt: now,
      updatedAt: now
    }

    users.push(user)

    return toPublicUser(user)
  }
}
