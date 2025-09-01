"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Search,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminApi, type User } from "@/lib/api";

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users with server-side filtering
  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "users", debouncedSearch, roleFilter, currentPage],
    queryFn: async () => {
      const response = await adminApi.getUsers({
        search: debouncedSearch,
        role: roleFilter,
        page: currentPage,
        limit: 20,
      });
      return response.data;
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await adminApi.updateUserRole(userId, role);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const handleRoleChange = (user: User, newRole: string) => {
    updateRoleMutation.mutate({ userId: user.id, role: newRole });
  };

  const handleRoleFilterChange = (newRole: string) => {
    setRoleFilter(newRole);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileDialogOpen(true);
  };

  const users = usersResponse?.users || [];
  const pagination = usersResponse?.pagination;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  // Memoized avatar component to prevent flashing
  const UserAvatar = ({
    user,
    size = "md",
  }: {
    user: User;
    size?: "sm" | "md" | "lg";
  }) => {
    const avatarUrl = useMemo(() => user.avatar || undefined, [user.avatar]);
    const fallback = useMemo(
      () => user.name.charAt(0).toUpperCase(),
      [user.name],
    );

    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-16 h-16",
    };

    const textSizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    return (
      <Avatar className={sizeClasses[size]}>
        <AvatarImage
          src={avatarUrl}
          alt={`${user.name}'s avatar`}
          className="object-cover"
        />
        <AvatarFallback
          className={`bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold ${textSizes[size]}`}
        >
          {fallback}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
        <div className="text-sm text-gray-500">
          Total Users: {pagination?.total || 0}
          {pagination && pagination.totalPages > 1 && (
            <span className="ml-2">
              (Page {pagination.page} of {pagination.totalPages})
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">Users</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border">
        {error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-red-600">Error loading users</div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-gray-600">Loading users...</div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={user} size="md" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="flex items-center space-x-1 w-fit"
                      >
                        {getRoleIcon(user.role)}
                        <span>{user.role}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div>Posts: {user._count?.posts || 0}</div>
                        <div>Likes: {user._count?.likes || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog
                          open={
                            isProfileDialogOpen && selectedUser?.id === user.id
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setIsProfileDialogOpen(false);
                              setSelectedUser(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(user)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>User Profile</DialogTitle>
                              <DialogDescription>
                                Detailed information about {user.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <UserAvatar user={user} size="lg" />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {user.name}
                                  </h3>
                                  <p className="text-gray-600">
                                    @{user.username}
                                  </p>
                                  <Badge
                                    variant={getRoleBadgeVariant(user.role)}
                                    className="flex items-center space-x-1 w-fit mt-1"
                                  >
                                    {getRoleIcon(user.role)}
                                    <span>{user.role}</span>
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    Email
                                  </div>
                                  <p className="text-gray-900">{user.email}</p>
                                </div>

                                {user.bio && (
                                  <div>
                                    <div className="text-sm font-medium text-gray-700">
                                      Bio
                                    </div>
                                    <p className="text-gray-900">{user.bio}</p>
                                  </div>
                                )}

                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    Member Since
                                  </div>
                                  <p className="text-gray-900">
                                    {new Date(
                                      user.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>

                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    Activity Stats
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 mt-2">
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-gray-900">
                                        {user._count?.posts || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Posts
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-gray-900">
                                        {user._count?.likes || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Likes
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-gray-900">
                                        {user._count?.comments || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Comments
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {user.role === "USER" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateRoleMutation.isPending}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                Make Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Promote to Admin
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to promote{" "}
                                  <strong>{user.name}</strong> to Admin? This
                                  will give them full administrative privileges.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRoleChange(user, "ADMIN")
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Promote to Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {user.role === "ADMIN" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateRoleMutation.isPending}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Demote to User
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Demote Admin
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to demote{" "}
                                  <strong>{user.name}</strong> to regular User?
                                  This will remove their administrative
                                  privileges.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRoleChange(user, "USER")}
                                >
                                  Demote to User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || roleFilter !== "ALL"
                  ? "No users found matching your filters"
                  : "No users found"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
