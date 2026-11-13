import DOMPurify from 'dompurify';

/** Sanitize user-generated text for safe rendering. Strips all HTML. */
export const sanitize = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/** Sanitize but allow basic formatting tags for rich descriptions. */
export const sanitizeRich = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [] 
  });
};
