import { loadEnvConfig } from "@next/env"
import { runTaskReminders } from "../src/lib/task-reminders"

loadEnvConfig(process.cwd())

async function main() {
  const force = process.argv.includes("--force")
  const result = await runTaskReminders({ force })
  console.log(JSON.stringify(result, null, 2))
  if (!result.success) process.exit(1)
}

main().catch((error) => {
  console.error("Error executing reminders:", error)
  process.exit(1)
})
