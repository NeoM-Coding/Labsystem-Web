import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLaboratoryFilterStore } from '../store/laboratoryFilterStore'
import type { Laboratory } from '../types'
import { LaboratoryFilterBar } from './LaboratoryFilterBar'

const laboratories: Laboratory[] = [{
  id: 'lab-1',
  buildingName: '创新楼',
  orgName: '计算机学院',
  laboratoryName: '16-201',
  extra: null,
  managers: [],
  createAt: '',
  updateAt: '',
}]

describe('LaboratoryFilterBar defaults', () => {
  afterEach(() => {
    cleanup()
    useLaboratoryFilterStore.setState({
      buildingNames: [],
      orgNames: [],
      matchedLaboratories: [],
      laboratoryIds: [],
      isResolving: true,
    })
  })

  it('selects the first option in every column once options resolve', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const getLaboratories = vi.fn().mockResolvedValue(laboratories)

    render(
      <QueryClientProvider client={client}>
        <LaboratoryFilterBar
          queryScope="first-option-test"
          selectAllOnResolve={false}
          selectFirstOnResolve
          dataSource={{
            getBuildingOptions: async () => [{ f: 'building-1', s: '创新楼' }],
            getOrganizationOptions: async () => [{ f: 'org-1', s: '计算机学院' }],
            getLaboratories,
          }}
        />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(useLaboratoryFilterStore.getState()).toMatchObject({
      buildingNames: ['创新楼'],
      orgNames: ['计算机学院'],
      laboratoryIds: ['lab-1'],
    }))
    expect(getLaboratories).toHaveBeenLastCalledWith(['创新楼'], ['计算机学院'])
  })
})
