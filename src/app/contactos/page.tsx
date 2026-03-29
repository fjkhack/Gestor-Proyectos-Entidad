import { prisma } from '@/lib/prisma'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Contactos',
}

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { name: 'asc' }
  })

  return <ContactsClient contacts={contacts} />
}
