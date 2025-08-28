"use client";

import { FileText, MessageSquare, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ContentManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">
            Content Management
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          Coming Soon
        </Badge>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Post Moderation
            </h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Review and moderate user posts, manage content visibility, and
            handle reported content.
          </p>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Features:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Bulk post actions</li>
              <li>• Content filtering</li>
              <li>• Automated moderation rules</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Comment Management
            </h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Monitor and manage user comments, handle spam detection, and
            maintain community standards.
          </p>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Features:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Comment approval queue</li>
              <li>• Spam detection</li>
              <li>• Community guidelines enforcement</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reports & Flags
            </h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Handle user reports, investigate flagged content, and take
            appropriate moderation actions.
          </p>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Features:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Report queue management</li>
              <li>• Investigation tools</li>
              <li>• Action history tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Content Statistics (Preview)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Pending Reviews</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Reported Content</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">Actions Taken</div>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <h4 className="font-semibold text-blue-900">
            Development in Progress
          </h4>
        </div>
        <p className="text-blue-800 text-sm">
          Content management features are currently under development. This will
          include comprehensive tools for post moderation, comment management,
          content filtering, and community guidelines enforcement.
        </p>
      </div>
    </div>
  );
}
