import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSupabase } from "@/context/supabaseContext";

pdfMake.vfs = pdfFonts.vfs;

const EnterpriseCandidates = () => {
  const { supabase } = useSupabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
useEffect(() => {
  async function fetchCandidates() {
    setLoading(true);

    const { data, error } = await supabase.from("candidates").select(`
        id,
        full_name,
        email_address,
        interview_date,
        id_status,
        check_in_status,
        interview_status,
        room_id,
        rooms!candidates_room_id_fkey (
          formatted_address
        )
      `);

    if (error) {
      console.error("Error fetching candidates:", error);
    }

    const combined = [...(data ?? [])];
    setCandidates(combined);
    setLoading(false); // Moved inside the async function
  }

  fetchCandidates();
}, [supabase]);


  const columns = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: "Candidate",
        cell: ({ row }) => {
          const candidate = row.original;
          return (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {candidate.full_name}
                </div>
                <div className="text-sm text-gray-600">
                  {candidate.email_address}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "interview_date",
        header: "Interview Date",
        cell: ({ getValue }) => {
          const dateString = getValue();
          return (
            <div className="text-sm text-gray-600">
              {formatDate(dateString)}
            </div>
          );
        },
      },
      {
        accessorKey: "rooms.formatted_address",
        header: "Location",
        cell: ({ row }) => {
          const address = row.original.rooms?.formatted_address;
          return (
            <div className="text-sm text-gray-600 max-w-xs truncate whitespace-nowrap">
              {address || "N/A"}
            </div>
          );
        },
      },
      {
        accessorKey: "id_status",
        header: "ID Status",
        cell: ({ getValue }) => getStatusBadge(getValue()),
      },
      {
        accessorKey: "check_in_status",
        header: "Check-in",
        cell: ({ getValue }) => getStatusBadge(getValue()),
      },
      {
        accessorKey: "interview_status",
        header: "Interview",
        cell: ({ getValue }) => getStatusBadge(getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </div>
        ),
      },
    ],
    []
  );

 // filter by veriief id
  const filteredCandidates = useMemo(() => {
    if (!statusFilter) return candidates;
    return candidates.filter(
      (c) =>
        c.id_status === statusFilter ||
        c.check_in_status === statusFilter ||
        c.interview_status === statusFilter
    );
  }, [candidates, statusFilter]);

  const table = useReactTable({
    data: filteredCandidates, // 👈 Change here
 
    columns,

    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const getStatusBadge = (status: string) => {
    if (!status) return null;

    const statusConfig = {
      "verified-id": {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      "pending-verification": {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      "checked-in": {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      confirmed: { color: "bg-gray-100 text-gray-800", icon: Clock },
      "no-show": { color: "bg-red-100 text-red-800", icon: XCircle },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      upcoming: { color: "bg-blue-100 text-blue-800", icon: Clock },
      "in-progress": { color: "bg-purple-100 text-purple-800", icon: Clock },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
      pending: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={`${config?.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{status.replace("-", " ")}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const exportPDF = () => {
    const tableBody = [
      [
        { text: "Full Name", style: "tableHeader" },
        { text: "Email", style: "tableHeader" },
        { text: "Interview Date", style: "tableHeader" },
        { text: "Location", style: "tableHeader" },
        { text: "ID Status", style: "tableHeader" },
        { text: "Check-in Status", style: "tableHeader" },
        { text: "Interview Status", style: "tableHeader" },
      ],
    ];

    candidates.forEach((c) => {
      tableBody.push([
        c.full_name,
        c.email_address,
        formatDate(c.interview_date),
        c.rooms?.formatted_address || "N/A",
        c.id_status || "N/A",
        c.check_in_status || "N/A",
        c.interview_status || "N/A",
      ]);
    });

    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "landscape",
      content: [
        { text: "Candidates List", style: "header" },
        {
          style: "tableExample",
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex, node, columnIndex) => {
              if (rowIndex === 0) return "#90EE90";
              return rowIndex % 2 === 0 ? "#f5f5f5" : null;
            },
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#aaa",
            vLineColor: () => "#aaa",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          marginBottom: 15,
          color: "#003366",
          alignment: "center",
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: "black",
          alignment: "center",
        },
      },
      defaultStyle: {
        fontSize: 11,
      },
    };

    pdfMake.createPdf(docDefinition).download("candidates-list.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <div className="text-sm text-gray-600">
          Total: {filteredCandidates.length} candidates
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                  Filter by Status
                  {statusFilter && (
                    <Badge
                      className={`ml-2 text-xs ${
                        statusFilter === "pending-verification"
                          ? "bg-yellow-100 text-yellow-800"
                          : statusFilter === "verified-id"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {statusFilter.replace("-", " ")}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("pending-verification")}
                >
                  Pending Verification
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("verified-id")}
                >
                  Verified ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  Clear Filter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={exportPDF}>
              Export List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading candidates...</p>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              No candidates match the selected filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {table.getRowModel().rows.length} of{" "}
                  {candidates.length} results
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {candidates.length === 0 && globalFilter && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No candidates found
            </h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseCandidates;
