/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as DocumentsImport } from './routes/documents'
import { Route as DashboardImport } from './routes/dashboard'

// Create/Update Routes

const DocumentsRoute = DocumentsImport.update({
  id: '/documents',
  path: '/documents',
  getParentRoute: () => rootRoute,
} as any)

const DashboardRoute = DashboardImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardImport
      parentRoute: typeof rootRoute
    }
    '/documents': {
      id: '/documents'
      path: '/documents'
      fullPath: '/documents'
      preLoaderRoute: typeof DocumentsImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/dashboard': typeof DashboardRoute
  '/documents': typeof DocumentsRoute
}

export interface FileRoutesByTo {
  '/dashboard': typeof DashboardRoute
  '/documents': typeof DocumentsRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/dashboard': typeof DashboardRoute
  '/documents': typeof DocumentsRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/dashboard' | '/documents'
  fileRoutesByTo: FileRoutesByTo
  to: '/dashboard' | '/documents'
  id: '__root__' | '/dashboard' | '/documents'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  DashboardRoute: typeof DashboardRoute
  DocumentsRoute: typeof DocumentsRoute
}

const rootRouteChildren: RootRouteChildren = {
  DashboardRoute: DashboardRoute,
  DocumentsRoute: DocumentsRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/dashboard",
        "/documents"
      ]
    },
    "/dashboard": {
      "filePath": "dashboard.tsx"
    },
    "/documents": {
      "filePath": "documents.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
