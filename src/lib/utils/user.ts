export type UserRole = 'admin' | 'tester' | 'user'
export type User = {
    id: string
    role: UserRole
}
export function getUser() {
    return { id: 'x', role: 'user' } as User
}
