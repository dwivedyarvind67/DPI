"use client";

import { useState } from "react";
import { usePipelineStore } from "@/store/pipelineStore";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Flow } from "@/lib/types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownAZ, ArrowUpZA } from "lucide-react";

export const columns: ColumnDef<Flow>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => new Date(row.getValue("timestamp")).toLocaleTimeString(),
  },
  {
    accessorKey: "src",
    header: "Source IP",
  },
  {
    accessorKey: "dst",
    header: "Dest IP",
  },
  {
    accessorKey: "dport",
    header: "Port",
  },
  {
    accessorKey: "proto",
    header: "Proto",
  },
  {
    accessorKey: "worker",
    header: "Worker",
    cell: ({ row }) => <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">W-{row.getValue("worker")}</span>,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      return <Badge variant={action === "drop" ? "destructive" : "default"}>{action.toUpperCase()}</Badge>;
    },
  },
];

export function FlowTable() {
  const data = usePipelineStore((state) => state.flows);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-4">
        <Input
          placeholder="Filter Source IP..."
          value={(table.getColumn("src")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("src")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground ml-auto">
          Showing {table.getFilteredRowModel().rows.length} latest flows (Ring Buffer Capped)
        </div>
      </div>
      <CardContent className="p-0 overflow-auto flex-1">
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="cursor-pointer hover:bg-secondary/50 select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUpZA className="w-3 h-3 text-primary" />,
                        desc: <ArrowDownAZ className="w-3 h-3 text-primary" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No active flows. Start the pipeline to see traffic.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
