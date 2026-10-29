/**
 * Publishes scheduled works that are due. For self-hosted servers, run it from cron:
 *
 *   * /5 * * * *  cd /path/to/site && npm run publish:scheduled   (remove the space after *)
 *
 * On Vercel or other hosts, call /api/cron/publish-scheduled instead (see README).
 */
import "./load-env";
import { db } from "../src/lib/db";
import { publishDueWorks } from "../src/lib/works/service";

publishDueWorks()
  .then((result) => {
    console.log(JSON.stringify({ ranAt: new Date().toISOString(), ...result }));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
