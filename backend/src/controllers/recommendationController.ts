import { Request, Response, NextFunction } from 'express';
import { NodeModel, NodeType } from '../models/Node';
import { RelationshipModel } from '../models/Relationship';
import { InstituteCourseMappingModel } from '../models/InstituteCourseMapping';

export class RecommendationController {
  /**
   * Recommends institutes based on a selected degree or career.
   * Query params:
   *  - degreeId: string (optional)
   *  - careerId: string (optional - resolves prerequisite degrees)
   *  - state: string (optional - filter by state)
   *  - ownership: string (optional - filter by ownership e.g. GOVERNMENT, PRIVATE)
   *  - maxFees: number (optional - filter by maximum estimated fees)
   *  - sortBy: 'nirf' | 'fees' | 'package' | 'placementRate' (optional, default 'nirf')
   */
  static async getRecommendedInstitutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { degreeId, careerId, state, ownership, maxFees, sortBy = 'nirf' } = req.query;

      // 1. Fetch matching institutes first if location or ownership filters are provided
      const instFilter: any = { type: NodeType.Institute };
      if (state) {
        instFilter['location.state'] = { $regex: new RegExp(state as string, 'i') };
      }
      if (ownership && ownership !== 'ALL') {
        instFilter.ownership = ownership;
      }

      const institutes = await NodeModel.find(instFilter);
      const instituteIds = institutes.map(i => i._id);

      // Initialize the mapping query filter
      const mappingFilter: any = {
        institute: { $in: instituteIds }
      };

      // 2. Resolve degree requirement
      if (degreeId) {
        mappingFilter.degree = degreeId;
      } else if (careerId) {
        // Find degrees that lead to or are prerequisite for this occupation
        const relationships = await RelationshipModel.find({ toNode: careerId });
        const fromNodeIds = relationships.map(r => r.fromNode);
        
        // Find which of these nodes are of type DEGREE
        const degrees = await NodeModel.find({
          _id: { $in: fromNodeIds },
          type: NodeType.Degree
        });
        const degreeIds = degrees.map(d => d._id);

        if (degreeIds.length === 0) {
          // No linked degrees found, return empty list
          res.status(200).json([]);
          return;
        }

        mappingFilter.degree = { $in: degreeIds };
      } else {
        // If neither is provided, we can either return all mappings or bad request.
        // Let's allow returning all mappings (acting as a search/compare).
      }

      // 3. Apply maximum fees filter
      if (maxFees) {
        const limitFees = parseFloat(maxFees as string);
        if (!isNaN(limitFees)) {
          mappingFilter.fees = { $lte: limitFees };
        }
      }

      // 4. Query mappings and populate details
      let mappings = await InstituteCourseMappingModel.find(mappingFilter)
        .populate('institute')
        .populate('degree')
        .populate('entranceExam');

      // 5. In-memory sorting (since it requires properties from populated institute)
      mappings.sort((a: any, b: any) => {
        if (sortBy === 'nirf') {
          const rankA = a.institute?.nirfRanking ?? 9999;
          const rankB = b.institute?.nirfRanking ?? 9999;
          return rankA - rankB;
        }
        
        if (sortBy === 'fees') {
          const feesA = a.fees ?? 99999999;
          const feesB = b.fees ?? 99999999;
          return feesA - feesB;
        }

        if (sortBy === 'package') {
          const pkgA = a.placementStats?.averageSalary ?? 0;
          const pkgB = b.placementStats?.averageSalary ?? 0;
          return pkgB - pkgA; // Descending
        }

        if (sortBy === 'placementRate') {
          const rateA = a.placementStats?.placementRate ?? 0;
          const rateB = b.placementStats?.placementRate ?? 0;
          return rateB - rateA; // Descending
        }

        return 0;
      });

      res.status(200).json(mappings);
    } catch (error) {
      next(error);
    }
  }
}
