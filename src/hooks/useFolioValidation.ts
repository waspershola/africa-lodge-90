/**
 * Phase 5: Folio Validation Hook
 * React hook for validating folio calculations
 */

import { useState, useCallback } from 'react';
import { validateFolio, autoFixFolio, ValidationResult } from '@/lib/folio-validator';
import { toast } from 'sonner';

export function useFolioValidation() {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validate = useCallback(async (folioId: string) => {
    setValidating(true);
    try {
      const result = await validateFolio(folioId);
      setValidationResult(result);

      if (!result.isValid) {
        toast.warning('Folio calculation discrepancies detected', {
          description: `Found ${result.discrepancies.length} issue(s)`,
        });
      }

      return result;
    } catch (error) {
      console.error('[useFolioValidation] Error:', error);
      toast.error('Failed to validate folio');
      return null;
    } finally {
      setValidating(false);
    }
  }, []);

  const autoFix = useCallback(async (folioId: string) => {
    setValidating(true);
    try {
      const fixed = await autoFixFolio(folioId);
      
      if (fixed) {
        toast.success('Folio recalculated successfully');
        // Re-validate after fix
        await validate(folioId);
      } else {
        toast.info('No corrections needed');
      }

      return fixed;
    } catch (error) {
      console.error('[useFolioValidation] Error:', error);
      toast.error('Failed to fix folio');
      return false;
    } finally {
      setValidating(false);
    }
  }, [validate]);

  return {
    validate,
    autoFix,
    validating,
    validationResult,
  };
}
