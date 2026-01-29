import { ViewState } from './types';

// Route configuration mapping ViewState to URL paths
export const routes: Record<ViewState, string> = {
  [ViewState.LANDING_PAGE]: '/',
  [ViewState.LOGIN]: '/login',
  [ViewState.REGISTER]: '/register',
  [ViewState.DASHBOARD]: '/dashboard',
  [ViewState.BUILDER]: '/builder',
  [ViewState.LANDING_PAGES]: '/landing-pages',
  [ViewState.REGISTRATIONS]: '/registrations',
  [ViewState.FORM_BUILDER]: '/forms',
  [ViewState.REGISTRATION_LIST]: '/registrations/list',
  [ViewState.CHECKIN]: '/checkin',
  [ViewState.SUBMISSIONS]: '/submissions',
  [ViewState.SUBMISSIONS_DASHBOARD]: '/submissions/dashboard',
  [ViewState.SUBMISSIONS_FOLLOW_UP]: '/submissions/follow-up',
  [ViewState.SUBMISSIONS_MANAGE]: '/submissions/manage',
  [ViewState.SUBMISSIONS_MANAGE_COMMITTEE]: '/submissions/committee',
  [ViewState.SUBMISSIONS_REPORTING]: '/submissions/reporting',
  [ViewState.JURY]: '/jury',
  [ViewState.JURY_DASHBOARD]: '/jury/dashboard',
  [ViewState.JURY_PROFILE]: '/jury/profile',
  [ViewState.JURY_INVITATIONS]: '/jury/invitations',
  [ViewState.JURY_EVENTS]: '/jury/events',
  [ViewState.JURY_REVIEWS]: '/jury/reviews',
  [ViewState.PARTICIPANT_REGISTRATIONS]: '/jury/registrations',
  [ViewState.PARTICIPANT_SUBMISSIONS]: '/jury/submissions',
  [ViewState.CERTIFICATES]: '/certificates',
  [ViewState.CERTIFICATE_TEMPLATE_BUILDER]: '/certificates/templates',
  [ViewState.CERTIFICATE_TEMPLATE_LIST]: '/certificates/templates',
  [ViewState.GENERATE_CERTIFICATES]: '/certificates/generate',
  [ViewState.CANVA_CERTIFICATE_BACKGROUND]: '/certificates/design',
  [ViewState.PROGRAM_BUILDER]: '/program-builder',
  [ViewState.EVENT_MANAGEMENT]: '/event-management',
  [ViewState.EVENT_PREVIEW]: '/event-management/preview/:eventId',
  [ViewState.ORGANIZER_PROFILE]: '/dashboard/profile',
  [ViewState.ACADEMY_LMS]: '/academy-lms',
  [ViewState.FILES_MANAGER]: '/files-manager',
  [ViewState.EMAILER]: '/emailer',
  [ViewState.BLOGS]: '/blogs',
  [ViewState.SETTINGS]: '/settings',
  [ViewState.PROJECT_MANAGEMENT]: '/project-management',
  [ViewState.PERSONNEL_MANAGEMENT]: '/project-management/personnel',
  [ViewState.PROJECTS]: '/project-management/projects',
  [ViewState.FOLLOW_UP]: '/project-management/follow-up',
  [ViewState.PARTICIPANT_TOOLS]: '/jury/tools',
  [ViewState.LATEX_EDITOR]: '/jury/tools/latex-editor',
};

// Helper function to get route path from ViewState
export const getRoutePath = (viewState: ViewState, params?: Record<string, string>): string => {
  let path = routes[viewState];
  
  if (params && Object.keys(params).length > 0) {
    // Append parameters to the path
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value) {
        // For builder, forms, and templates, append the ID
        if ((viewState === ViewState.BUILDER && key === 'pageId') ||
            (viewState === ViewState.FORM_BUILDER && key === 'formId') ||
            (viewState === ViewState.CERTIFICATE_TEMPLATE_BUILDER && key === 'templateId')) {
          path = `${path}/${value}`;
        } else {
          // For other routes, replace placeholder
          path = path.replace(`:${key}?`, value).replace(`:${key}`, value);
        }
      }
    });
  }
  
  return path;
};

// Helper function to get ViewState from pathname
export const getViewStateFromPath = (pathname: string): ViewState | null => {
  // Remove trailing slashes (except for root)
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  
  // Check exact matches first (more specific routes first)
  const sortedRoutes = Object.entries(routes).sort((a, b) => {
    // Sort by specificity: longer paths first, then by number of params
    const aDepth = a[1].split('/').length;
    const bDepth = b[1].split('/').length;
    if (bDepth !== aDepth) return bDepth - aDepth;
    return b[1].length - a[1].length;
  });
  
  for (const [viewState, route] of sortedRoutes) {
    // Convert route pattern to regex
    let routePattern = route
      .replace(/:[^/]*\?/g, '(?:/[^/]+)?') // Optional params with leading slash
      .replace(/:[^/]+/g, '[^/]+') // Required params
      .replace(/\//g, '\\/'); // Escape slashes
    
    // Handle root path specially
    if (route === '/') {
      routePattern = '^/$';
    } else {
      routePattern = `^${routePattern}$`;
    }
    
    const regex = new RegExp(routePattern);
    if (regex.test(cleanPath)) {
      return viewState as ViewState;
    }
  }
  
  return null;
};

// Extract params from pathname
export const extractParams = (pathname: string, viewState: ViewState): Record<string, string> => {
  const route = routes[viewState];
  const params: Record<string, string> = {};
  
  const routeParts = route.split('/');
  const pathParts = pathname.split('/');
  
  routeParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.replace(':', '').replace('?', '');
      if (pathParts[index]) {
        params[paramName] = pathParts[index];
      }
    }
  });
  
  return params;
};

