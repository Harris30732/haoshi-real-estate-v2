'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Property } from '@/types/property'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'
import { PROPERTY_STATUS, CONTRACT_TYPES, ITEMS_PER_PAGE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useCompare } from '@/hooks/use-compare'
import { useRouter } from 'next/navigation'

interface PropertyTableProps {
  data: Property[]
  onEdit?: (property: Property) => void
  onDelete?: (id: string) => void
  onViewPhotos?: (property: Property) => void
}

const fmt = (n: number | null | undefined) =>
  n != null && !isNaN(n) ? n.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '—'

const statusColor: Record<string, string> = {
  [PROPERTY_STATUS.FOR_SALE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [PROPERTY_STATUS.DELISTED]: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  [PROPERTY_STATUS.SOLD]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [CONTRACT_TYPES.EXCLUSIVE]: 'bg-orange-100 text-orange-800',
  [CONTRACT_TYPES.GENERAL]: 'bg-yellow-100 text-yellow-800',
  [CONTRACT_TYPES.OWNER]: 'bg-purple-100 text-purple-800',
}

const columns: ColumnDef<Property>[] = [
  {
    id: 'compare',
    header: '比較',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onToggleCompare?: (id: string) => void; isCompared?: (id: string) => boolean }
      const checked = meta?.isCompared?.(row.original.id) || false
      return (
        <Checkbox
          checked={checked}
          onCheckedChange={() => meta?.onToggleCompare?.(row.original.id)}
        />
      )
    },
  },
  {
    accessorKey: 'community_name',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-8 px-1 -ml-1" onClick={() => column.toggleSorting()}>
        社區 <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('community_name')}</span>,
  },
  {
    accessorKey: 'total_price',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-8 px-1" onClick={() => column.toggleSorting()}>
        總價(萬) <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => fmt(row.getValue('total_price')),
  },
  {
    accessorKey: 'total_ping',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-8 px-1" onClick={() => column.toggleSorting()}>
        總坪 <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => fmt(row.getValue('total_ping')),
  },
  {
    accessorKey: 'house_ping',
    header: '室內坪',
    cell: ({ row }) => fmt(row.original.house_ping),
  },
  {
    accessorKey: 'unit_price',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-8 px-1" onClick={() => column.toggleSorting()}>
        單價 <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => fmt(row.original.unit_price),
  },
  {
    accessorKey: 'parking_ping',
    header: '車位坪',
    cell: ({ row }) => fmt(row.getValue('parking_ping')),
  },
  {
    accessorKey: 'parking_price',
    header: '車價(萬)',
    cell: ({ row }) => fmt(row.getValue('parking_price')),
  },
  {
    accessorKey: 'floor_info',
    header: '樓層',
    cell: ({ row }) => row.getValue('floor_info') || '—',
  },
  {
    accessorKey: 'address',
    header: '地址',
    cell: ({ row }) => (
      <span className="max-w-[160px] truncate block" title={row.getValue('address') as string}>
        {row.getValue('address') || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'layout',
    header: '格局',
    cell: ({ row }) => row.getValue('layout') || '—',
  },
  {
    accessorKey: 'status',
    header: '狀態',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant="secondary" className={cn('text-xs', statusColor[status])}>
          {status || '—'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'contract_type',
    header: '委託',
    cell: ({ row }) => {
      const ct = row.getValue('contract_type') as string
      return ct ? (
        <Badge variant="outline" className={cn('text-xs', statusColor[ct])}>
          {ct}
        </Badge>
      ) : '—'
    },
  },
  {
    id: 'photos',
    header: '照片',
    cell: ({ row }) => {
      const count = row.original.photo_paths?.length || 0
      return count > 0 ? (
        <Badge variant="secondary" className="text-xs">
          <ImageIcon className="h-3 w-3 mr-1" />{count}
        </Badge>
      ) : '—'
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onEdit?: (p: Property) => void; onDelete?: (id: string) => void }
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => meta?.onEdit?.(row.original)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => meta?.onDelete?.(row.original.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  },
]

export function PropertyTable({ data, onEdit, onDelete }: PropertyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { toggle, isSelected } = useCompare()
  const router = useRouter()

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: ITEMS_PER_PAGE } },
    meta: { onEdit, onDelete, onToggleCompare: toggle, isCompared: isSelected },
  })

  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="whitespace-nowrap text-xs">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  暫無資料
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="text-sm cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/properties/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
        <span>
          共 {table.getFilteredRowModel().rows.length} 筆，
          第 {table.getState().pagination.pageIndex + 1}/{table.getPageCount()} 頁
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
