'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCommunity, updateCommunity, deleteCommunity } from '@/lib/api'
import { Community } from '@/types/community'
import toast from 'react-hot-toast'

export function useCreateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Community>) => createCommunity(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-data'] }); toast.success('社區新增成功') },
    onError: () => toast.error('新增失敗'),
  })
}

export function useUpdateCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Community> }) => updateCommunity(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-data'] }); toast.success('社區更新成功') },
    onError: () => toast.error('更新失敗'),
  })
}

export function useDeleteCommunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCommunity(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-data'] }); toast.success('社區已刪除') },
    onError: () => toast.error('刪除失敗'),
  })
}
