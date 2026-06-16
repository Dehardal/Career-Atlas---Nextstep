import { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../services/validationService';

export class ValidationController {
  /**
   * Runs database diagnostics checks and returns the validation report.
   */
  static async getValidationReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ValidationService.runDiagnostics();
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  }
}
