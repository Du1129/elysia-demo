import type { UserModel } from './model'

const users: UserModel.User[] = [
  {
    id: '018f3f79-7a13-7c0d-9d8e-fcc6e2f14a10',
    name: 'July',
    email: 'july@example.com',
    createdAt: new Date('2026-07-07T00:00:00.000Z')
  }
]

export abstract class UserService {
  static list() {
    return users
  }

  static findById(id: string) {
    return users.find((user) => user.id === id)
  }

  static create(input: UserModel.CreateBody) {
    const user = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date()
    }

    users.push(user)

    return user
  }
}
