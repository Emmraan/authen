import { AdminController } from '../../src/modules/admin/admin.controller'

describe('AdminController', () => {
    let controller: AdminController
    const mockAdminService: any = {
        setActive: jest.fn().mockResolvedValue(undefined),
        setRole: jest.fn().mockResolvedValue(undefined),
        forceLogout: jest.fn().mockResolvedValue(undefined),
    }

    beforeEach(() => {
        controller = new AdminController(mockAdminService)
        jest.clearAllMocks()
    })

    it('deactivate calls setActive(false) and returns message', async () => {
        const res = await controller.deactivate('user-1')
        expect(mockAdminService.setActive).toHaveBeenCalledWith('user-1', false)
        expect(res).toEqual({ message: 'User deactivated' })
    })

    it('activate calls setActive(true) and returns message', async () => {
        const res = await controller.activate('user-2')
        expect(mockAdminService.setActive).toHaveBeenCalledWith('user-2', true)
        expect(res).toEqual({ message: 'User activated' })
    })

    it('setRole calls setRole and returns message', async () => {
        const res = await controller.setRole('user-3', { role: 'admin' } as any)
        expect(mockAdminService.setRole).toHaveBeenCalledWith('user-3', 'admin')
        expect(res).toEqual({ message: 'Role updated' })
    })

    it('forceLogout calls forceLogout and returns message', async () => {
        const res = await controller.forceLogout('user-4')
        expect(mockAdminService.forceLogout).toHaveBeenCalledWith('user-4')
        expect(res).toEqual({ message: 'User logged out from all sessions' })
    })
})
