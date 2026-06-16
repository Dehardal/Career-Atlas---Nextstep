import mongoose from 'mongoose';
import { connectDatabase } from './config/db';
import { ValidationService } from './services/validationService';

async function runTest() {
  await connectDatabase();

  console.log('--- DATA VALIDATION ENGINE TEST ---');
  console.log('Running diagnostics checks...');

  const report = await ValidationService.runDiagnostics();

  console.log('\n================ SUMMARY REPORT ================');
  console.log(`Total Validation Issues Detected: ${report.summary.totalIssues}`);
  console.log(`  - Broken Relationships: ${report.summary.brokenRelationships}`);
  console.log(`  - Circular Pathways: ${report.summary.circularRelationships}`);
  console.log(`  - Invalid Degree Transitions: ${report.summary.invalidDegreePathways}`);
  console.log(`  - Missing Entrance Exam Relations: ${report.summary.missingEntranceExams}`);
  console.log(`  - Missing Eligibility Rules: ${report.summary.missingEligibilityRules}`);
  console.log(`  - Duplicate Careers: ${report.summary.duplicateCareers}`);
  console.log(`  - Duplicate Institutes: ${report.summary.duplicateInstitutes}`);
  console.log('================================================');

  if (report.issues.length > 0) {
    console.log('\nDetailed Issues Listing:');
    report.issues.forEach((issue, idx) => {
      console.log(`\n[${idx + 1}] TYPE: ${issue.type} | SEVERITY: ${issue.severity}`);
      console.log(`    Message: ${issue.message}`);
      if (issue.details) {
        console.log(`    Details: ${JSON.stringify(issue.details)}`);
      }
    });
  } else {
    console.log('\nNo validation issues detected! Database is fully consistent.');
  }

  mongoose.connection.close();
  console.log('\n--- DIAGNOSTICS TEST COMPLETED ---');
}

runTest().catch((err) => {
  console.error('Diagnostics test failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
