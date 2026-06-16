import { Request, Response, NextFunction } from 'express';
import { EligibilityRuleModel, RuleType } from '../models/EligibilityRule';
import { NodeModel } from '../models/Node';
import { EligibilityService } from '../services/eligibilityService';

export class EligibilityController {
  /**
   * GET /api/v1/eligibility-rules
   * Retrieve all rules with fully populated details
   */
  static async getRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await EligibilityService.getAllRulesPopulated();
      res.status(200).json(rules);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/eligibility-rules
   * Create a new academic eligibility rule
   */
  static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        sourceNode, 
        targetNode, 
        ruleType, 
        mandatorySubjects, 
        preferredSubjects, 
        entranceExamRequirements, 
        minimumQualification, 
        exceptions 
      } = req.body;

      if (!sourceNode || !targetNode) {
        res.status(400).json({ error: 'Both sourceNode and targetNode are required fields' });
        return;
      }

      if (sourceNode === targetNode) {
        res.status(400).json({ error: 'Source and Target nodes cannot be the same node' });
        return;
      }

      // 1. Validate node existence in the graph database
      const sourceExists = await NodeModel.exists({ _id: sourceNode });
      const targetExists = await NodeModel.exists({ _id: targetNode });

      if (!sourceExists || !targetExists) {
        res.status(404).json({ error: 'Source or Target node does not exist in the database' });
        return;
      }

      if (minimumQualification) {
        const qualExists = await NodeModel.exists({ _id: minimumQualification });
        if (!qualExists) {
          res.status(404).json({ error: 'Minimum qualification node does not exist' });
          return;
        }
      }

      // Check duplicate rule
      const duplicateExists = await EligibilityRuleModel.exists({ sourceNode, targetNode });
      if (duplicateExists) {
        res.status(400).json({ error: 'An eligibility rule already exists for this Source and Target combination.' });
        return;
      }

      // 2. Create and save rule
      const rule = new EligibilityRuleModel({
        sourceNode,
        targetNode,
        ruleType: ruleType || RuleType.Allow,
        mandatorySubjects: mandatorySubjects || [],
        preferredSubjects: preferredSubjects || [],
        entranceExamRequirements: entranceExamRequirements || [],
        minimumQualification: minimumQualification || undefined,
        exceptions: exceptions || ''
      });

      const savedRule = await rule.save();
      
      // Populate and return
      const populatedRule = await EligibilityRuleModel.findById(savedRule._id)
        .populate('sourceNode')
        .populate('targetNode')
        .populate('entranceExamRequirements')
        .populate('minimumQualification');

      res.status(201).json(populatedRule);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/eligibility-rules/:id
   * Update an existing academic rule
   */
  static async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const rule = await EligibilityRuleModel.findByIdAndUpdate(id, updates, { new: true })
        .populate('sourceNode')
        .populate('targetNode')
        .populate('entranceExamRequirements')
        .populate('minimumQualification');

      if (!rule) {
        res.status(404).json({ error: 'Rule not found' });
        return;
      }

      res.status(200).json(rule);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/eligibility-rules/:id
   * Remove a rule
   */
  static async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deletedRule = await EligibilityRuleModel.findByIdAndDelete(id);

      if (!deletedRule) {
        res.status(404).json({ error: 'Eligibility rule not found' });
        return;
      }

      res.status(200).json({ message: 'Eligibility rule deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
export default EligibilityController;
