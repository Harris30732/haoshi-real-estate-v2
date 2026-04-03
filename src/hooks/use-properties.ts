'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllData, createProperty, updateProperty, deleteProperty } from '@/lib/api'
import { Property, PropertyFormData } from '@/types/property'
import toast from 'react-hot-toast'

// Compute derived fields
function enrichProperty(p: Property): Property {
  const totalPing = parseFloat(String(p.total_ping)) || 0
  const parkingPing = parseFloat(String(p.parking_ping)) || 0
  const parkingPrice = parseFloat(String(p.parking_price)) || 0
  const totalPrice = parseFloat(String(p.total_price)) || 0
  const housePing = totalPing - parkingPing
  const housePrice = totalPrice - parkingPrice
  const unitPrice = housePing > 0 ? housePrice / housePing : 0

  return {
    ...p,
    house_ping: Math.round(housePing * 100) / 100,
    unit_price: Math.round(unitPrice * 100) / 100,
  }
}

export function useProperties() {
  return useQuery({
    queryKey: ['all-data'],
    queryFn: fetchAllData,
    select: (data) => ({
      ...data,
      properties: data.properties.map(enrichProperty),
    }),
    staleTime: 60_000,
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PropertyFormData) => createProperty(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-data'] })
      toast.success('物件新增成功')
    },
    onError: () => toast.error('新增失敗'),
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
      updateProperty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-data'] })
      toast.success('物件更新成功')
    },
    onError: () => toast.error('更新失敗'),
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-data'] })
      toast.success('物件已刪除')
    },
    onError: () => toast.error('刪除失敗'),
  })
}
