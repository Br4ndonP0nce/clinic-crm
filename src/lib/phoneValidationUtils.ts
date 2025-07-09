// Phone validation utilities for international mobile numbers
// Based on ITU-T E.164 standards and country-specific mobile patterns

export interface CountryValidation {
    code: string;
    country: string;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    example: string;
  }
  
  export interface PhoneValidationResult {
    isValid: boolean;
    error?: string;
    formattedNumber?: string;
    country?: string;
  }
  
  // Comprehensive country validation patterns (Mobile numbers only)
  export const COUNTRY_VALIDATIONS: CountryValidation[] = [
    // Latin America (prioritized)
    {
      code: "+52",
      country: "Mexico",
      minLength: 10,
      maxLength: 10,
      pattern: /^[1-9]\d{9}$/, // All mobile numbers are 10 digits, can't start with 0
      example: "5512345678"
    },
    {
        code: "+54",
        country: "Argentina",
        minLength: 10,
        maxLength: 11, // Allow for +54 9 11 1234 5678 format
        // Pattern allows: area code + number OR 9 + area code + number
        pattern: /^(9)?(11|[2-8]\d{1,2})\d{6,8}$/, 
        example: "1191234567"
      },
    {
      code: "+55",
      country: "Brazil",
      minLength: 11,
      maxLength: 11,
      pattern: /^\d{2}9\d{8}$/, // Area code (2) + 9 + 8 digits = 11 total
      example: "11987654321"
    },
    {
        code: "+56",
        country: "Chile", 
        minLength: 9,
        maxLength: 9,
        pattern: /^9\d{8}$/, // Must start with 9, followed by 8 digits
        example: "912345678"
      },
    {
      code: "+57",
      country: "Colombia",
      minLength: 10,
      maxLength: 10,
      pattern: /^3\d{9}$/, // Mobile starts with 3
      example: "3001234567"
    },
    {
      code: "+506",
      country: "Costa Rica",
      minLength: 8,
      maxLength: 8,
      pattern: /^[6-8]\d{7}$/, // Mobile starts with 6, 7, or 8
      example: "87654321"
    },
    {
      code: "+51",
      country: "Peru",
      minLength: 9,
      maxLength: 9,
      pattern: /^9\d{8}$/, // Mobile starts with 9
      example: "987654321"
    },
    {
        code: "+58",
        country: "Venezuela",
        minLength: 10,
        maxLength: 10,
        // Mobile operators: 412, 414, 416, 424, 426 (without leading 0)
        pattern: /^(412|414|416|424|426)\d{7}$/, 
        example: "4141234567"
      },
    {
      code: "+593",
      country: "Ecuador",
      minLength: 9,
      maxLength: 9,
      pattern: /^9\d{8}$/, // Mobile starts with 9
      example: "987654321"
    },
    {
      code: "+591",
      country: "Bolivia",
      minLength: 8,
      maxLength: 8,
      pattern: /^[67]\d{7}$/, // Mobile starts with 6 or 7
      example: "71234567"
    },
    {
      code: "+598",
      country: "Uruguay",
      minLength: 8,
      maxLength: 8,
      pattern: /^9\d{7}$/, // Mobile starts with 9
      example: "91234567"
    },
    {
      code: "+595",
      country: "Paraguay",
      minLength: 9,
      maxLength: 9,
      pattern: /^9\d{8}$/, // Mobile starts with 9
      example: "987654321"
    },
    {
      code: "+507",
      country: "Panama",
      minLength: 8,
      maxLength: 8,
      pattern: /^[6-9]\d{7}$/, // Mobile starts with 6-9
      example: "61234567"
    },
    {
      code: "+503",
      country: "El Salvador",
      minLength: 8,
      maxLength: 8,
      pattern: /^[67]\d{7}$/, // Mobile starts with 6 or 7
      example: "71234567"
    },
    {
      code: "+502",
      country: "Guatemala",
      minLength: 8,
      maxLength: 8,
      pattern: /^[45]\d{7}$/, // Mobile starts with 4 or 5
      example: "51234567"
    },
    {
        code: "+504",
        country: "Honduras", 
        minLength: 8,
        maxLength: 10, // Allow for 00 prefix
        // Accept with or without leading 00
        pattern: /^(00)?[389]\d{7}$/, 
        example: "91234567"
      },
    {
      code: "+505",
      country: "Nicaragua",
      minLength: 8,
      maxLength: 8,
      pattern: /^[58]\d{7}$/, // Mobile starts with 5 or 8
      example: "81234567"
    },
    {
      code: "+53",
      country: "Cuba",
      minLength: 8,
      maxLength: 8,
      pattern: /^5\d{7}$/, // Mobile starts with 5
      example: "51234567"
    },
    {
      code: "+509",
      country: "Haiti",
      minLength: 8,
      maxLength: 8,
      pattern: /^[34]\d{7}$/, // Mobile starts with 3 or 4
      example: "31234567"
    },
    
    // North America - NANP countries
    {
      code: "+1",
      country: "United States",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "2125551234"
    },
    {
      code: "+1",
      country: "Canada",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "4165551234"
    },
    {
      code: "+1",
      country: "Dominican Republic",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "8095551234"
    },
    {
      code: "+1",
      country: "Puerto Rico",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "7875551234"
    },
    {
      code: "+1",
      country: "Jamaica",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "8765551234"
    },
    {
      code: "+1",
      country: "Trinidad and Tobago",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "8685551234"
    },
    {
      code: "+1",
      country: "Barbados",
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9][0-8]\d[2-9]\d{2}\d{4}$/,
      example: "2465551234"
    },
    
    // Europe
    {
      code: "+34",
      country: "Spain",
      minLength: 9,
      maxLength: 9,
      pattern: /^[67]\d{8}$/, // Mobile starts with 6 or 7, total 9 digits
      example: "612345678"
    },
    {
      code: "+33",
      country: "France",
      minLength: 9,
      maxLength: 9,
      pattern: /^[67]\d{8}$/, // Mobile starts with 6 or 7
      example: "612345678"
    },
    {
      code: "+49",
      country: "Germany",
      minLength: 10,
      maxLength: 11,
      pattern: /^1[5-7]\d{8,9}$/, // Mobile 15x, 16x, 17x
      example: "15123456789"
    },
    {
      code: "+44",
      country: "United Kingdom",
      minLength: 10,
      maxLength: 10,
      pattern: /^7\d{9}$/, // Mobile starts with 7
      example: "7123456789"
    },
    {
      code: "+39",
      country: "Italy",
      minLength: 9,
      maxLength: 10,
      pattern: /^3\d{8,9}$/, // Mobile starts with 3
      example: "3123456789"
    },
    
    // Asia
    {
      code: "+86",
      country: "China",
      minLength: 11,
      maxLength: 11,
      pattern: /^1[3-9]\d{9}$/, // Mobile starts with 13-19
      example: "13912345678"
    },
    {
      code: "+91",
      country: "India",
      minLength: 10,
      maxLength: 10,
      pattern: /^[6-9]\d{9}$/, // Mobile starts with 6-9
      example: "9876543210"
    },
    {
      code: "+81",
      country: "Japan",
      minLength: 10,
      maxLength: 10,
      pattern: /^[789]0\d{8}$/, // Mobile 70, 80, 90
      example: "9012345678"
    },
    {
      code: "+82",
      country: "South Korea",
      minLength: 9,
      maxLength: 10,
      pattern: /^1[0-9]\d{7,8}$/, // Mobile starts with 10-19
      example: "1012345678"
    },
    
    // Africa
    {
      code: "+27",
      country: "South Africa",
      minLength: 9,
      maxLength: 9,
      pattern: /^[67]\d{8}$/, // Mobile starts with 6 or 7
      example: "712345678"
    },
    {
      code: "+234",
      country: "Nigeria",
      minLength: 10,
      maxLength: 10,
      pattern: /^[789]\d{9}$/, // Mobile starts with 7, 8, or 9
      example: "8012345678"
    },
    {
      code: "+20",
      country: "Egypt",
      minLength: 10,
      maxLength: 10,
      pattern: /^1[0125]\d{8}$/, // Mobile starts with 10, 11, 12, 15
      example: "1012345678"
    },
    
    // Middle East
    {
      code: "+971",
      country: "United Arab Emirates",
      minLength: 9,
      maxLength: 9,
      pattern: /^5[0-9]\d{7}$/, // Mobile starts with 50-59
      example: "501234567"
    },
    {
      code: "+966",
      country: "Saudi Arabia",
      minLength: 9,
      maxLength: 9,
      pattern: /^5[0-9]\d{7}$/, // Mobile starts with 50-59
      example: "501234567"
    },
    {
      code: "+972",
      country: "Israel",
      minLength: 9,
      maxLength: 9,
      pattern: /^5[0-9]\d{7}$/, // Mobile starts with 50-59
      example: "501234567"
    },
    
    // Oceania
    {
      code: "+61",
      country: "Australia",
      minLength: 9,
      maxLength: 9,
      pattern: /^4\d{8}$/, // Mobile starts with 4
      example: "412345678"
    },
    {
      code: "+64",
      country: "New Zealand",
      minLength: 8,
      maxLength: 9,
      pattern: /^2[0-9]\d{6,7}$/, // Mobile starts with 20-29
      example: "21234567"
    },
    
    // Default fallback for unlisted countries
    {
      code: "+999",
      country: "Other",
      minLength: 8,
      maxLength: 15,
      pattern: /^\d{8,15}$/,
      example: "1234567890"
    }
  ];
  
  /**
   * Email validation using RFC 5322 compliant regex
   */
  export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email addresses with stricter TLD requirements
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const trimmedEmail = email.trim();
  
  // Basic format check with TLD requirement
  if (!EMAIL_REGEX.test(trimmedEmail)) return false;
  
  // Additional checks for edge cases
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domainPart] = parts;
  
  // Local part validations
  if (localPart.length === 0 || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;
  
  // Domain part validations
  if (domainPart.length === 0 || domainPart.length > 253) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
  if (domainPart.includes('..')) return false;
  
  // Ensure domain has at least one dot (TLD requirement)
  if (!domainPart.includes('.')) return false;
  
  // Check TLD is at least 2 characters and not just numbers
  const domainParts = domainPart.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || /^\d+$/.test(tld)) return false;
  
  return true;
};
  /**
   * Validates name fields
   */
  export const validateName = (name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length >= 2;
  };
  
  /**
   * Extracts numeric digits from a phone number string
   */
  export const extractPhoneDigits = (phoneNumber: string): string => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return '';
    return phoneNumber.replace(/[^\d]/g, '');
  };
  
  /**
   * Finds country validation by country code
   */
  export const findCountryValidation = (countryCode: string): CountryValidation | null => {
    if (!countryCode) return null;
    
    return COUNTRY_VALIDATIONS.find(c => c.code === countryCode) || 
           COUNTRY_VALIDATIONS.find(c => c.code === "+999") || // fallback
           null;
  };
  
  /**
   * Validates international mobile phone numbers
   * @param phoneNumber - The phone number (can include country code or be national format)
   * @param countryCode - The country code (e.g., "+52", "+55")
   * @returns Validation result with error details
   */
  export const validatePhone = (phoneNumber: string, countryCode: string): PhoneValidationResult => {
    // Input validation
    if (!phoneNumber || !countryCode) {
      return { 
        isValid: false, 
        error: "Número de teléfono y código de país requeridos" 
      };
    }
  
    if (typeof phoneNumber !== 'string' || typeof countryCode !== 'string') {
      return { 
        isValid: false, 
        error: "Formato de entrada inválido" 
      };
    }
  
    // Extract only digits from phone number (remove spaces, dashes, etc.)
    let cleanNumber = extractPhoneDigits(phoneNumber);
    
    // Remove country code if it's included in the phone number
    if (cleanNumber.startsWith(countryCode.replace('+', ''))) {
      cleanNumber = cleanNumber.substring(countryCode.replace('+', '').length);
    }
    
    if (!cleanNumber) {
      return { 
        isValid: false, 
        error: "El número de teléfono debe contener dígitos" 
      };
    }
  
    // Find country validation pattern
    const countryValidation = findCountryValidation(countryCode);
    
    if (!countryValidation) {
      return { 
        isValid: false, 
        error: `País no soportado: ${countryCode}` 
      };
    }
  
    // Length validation
    if (cleanNumber.length < countryValidation.minLength || cleanNumber.length > countryValidation.maxLength) {
      const lengthMsg = countryValidation.minLength === countryValidation.maxLength 
        ? `${countryValidation.minLength} dígitos`
        : `entre ${countryValidation.minLength} y ${countryValidation.maxLength} dígitos`;
      
      return { 
        isValid: false, 
        error: `El número móvil para ${countryValidation.country} debe tener ${lengthMsg}`,
        country: countryValidation.country
      };
    }
  
    // Pattern validation (mobile-specific format)
    if (!countryValidation.pattern.test(cleanNumber)) {
      return { 
        isValid: false, 
        error: `Formato de móvil inválido para ${countryValidation.country}. Ejemplo: ${countryCode} ${countryValidation.example}`,
        country: countryValidation.country
      };
    }
  
    // Success case
    return { 
      isValid: true,
      formattedNumber: `${countryCode} ${cleanNumber}`,
      country: countryValidation.country
    };
  };
  
  /**
   * Generates WhatsApp link with pre-filled message
   */
  export const generateWhatsAppLink = (
    message: string = "Hola, acabo de aplicar a Edición Persuasiva"
  ): string => {
    const teamWhatsAppNumber = "525522838461"; // Team's WhatsApp number
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${teamWhatsAppNumber}?text=${encodedMessage}`;
  };
  
  /**
   * Formats phone number for display
   */
  export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
    let cleanNumber = extractPhoneDigits(phoneNumber);
    
    // Remove country code if it's included in the phone number
    if (cleanNumber.startsWith(countryCode.replace('+', ''))) {
      cleanNumber = cleanNumber.substring(countryCode.replace('+', '').length);
    }
    
    if (!cleanNumber) return phoneNumber;
    
    return `${countryCode} ${cleanNumber}`;
  };
  
  /**
   * Validates if a phone number is potentially a WhatsApp number
   */
  export const isWhatsAppCompatible = (phoneNumber: string, countryCode: string): boolean => {
    const validation = validatePhone(phoneNumber, countryCode);
    return validation.isValid;
  };
  
  /**
   * Gets country information by country code
   */
  export const getCountryInfo = (countryCode: string): CountryValidation | null => {
    return findCountryValidation(countryCode);
  };
  
  /**
   * Gets all supported country codes
   */
  export const getSupportedCountries = (): CountryValidation[] => {
    return COUNTRY_VALIDATIONS.filter(c => c.code !== "+999");
  };
  
  /**
   * Checks if a country code is supported
   */
  export const isCountrySupported = (countryCode: string): boolean => {
    return COUNTRY_VALIDATIONS.some(c => c.code === countryCode && c.code !== "+999");
  };