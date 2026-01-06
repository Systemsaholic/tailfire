import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Seed database with test data
 *
 * Creates:
 * - 30 contacts (mix of leads and clients)
 * - 15+ contact relationships (family, business, travel companions)
 * - 5+ contact groups (families, corporate groups, wedding parties)
 * - Group memberships
 *
 * @param connectionString - PostgreSQL connection string
 */
export async function seedDatabase(connectionString: string) {
  console.log('🌱 Seeding database with test data...')

  const connection = postgres(connectionString, { max: 1 })
  const db = drizzle(connection, { schema })

  try {
    // ========================================================================
    // CONTACTS
    // ========================================================================
    console.log('Creating contacts...')

    const contacts = await db.insert(schema.contacts).values([
      // Family 1: Smith Family
      {
        firstName: 'John',
        lastName: 'Smith',
        legalFirstName: 'Jonathan',
        legalLastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        dateOfBirth: '1980-05-15',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Married',
        addressLine1: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CAN',
        passportNumber: 'CA12345678',
        passportExpiry: '2026-12-31',
        passportCountry: 'CAN',
        nationality: 'CAN',
        knownTravelerNumber: 'KTN1234567',
        seatPreference: 'Aisle',
        cabinPreference: 'Economy Plus',
        contactType: 'client',
        contactStatus: 'booked',
        becameClientAt: new Date('2023-01-15'),
        marketingEmailOptIn: true,
        marketingSmsOptIn: true,
        marketingOptInSource: 'Website signup',
        tags: ['VIP', 'Family Travel'],
      },
      {
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@email.com',
        phone: '(555) 123-4568',
        dateOfBirth: '1982-08-22',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Married',
        addressLine1: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CAN',
        passportNumber: 'CA87654321',
        passportExpiry: '2027-06-30',
        passportCountry: 'CAN',
        nationality: 'CAN',
        seatPreference: 'Window',
        cabinPreference: 'Economy Plus',
        dietaryRequirements: 'Vegetarian',
        contactType: 'client',
        contactStatus: 'booked',
        becameClientAt: new Date('2023-01-15'),
        marketingEmailOptIn: true,
        marketingOptInSource: 'Website signup',
        tags: ['Family Travel'],
      },

      // Family 2: Johnson Family
      {
        firstName: 'David',
        lastName: 'Johnson',
        preferredName: 'Dave',
        email: 'dave.johnson@email.com',
        phone: '(555) 234-5678',
        dateOfBirth: '1975-03-10',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Married',
        addressLine1: '456 Oak Ave',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1A1',
        country: 'CAN',
        passportNumber: 'CA11223344',
        passportExpiry: '2025-03-15',
        passportCountry: 'CAN',
        nationality: 'CAN',
        mobilityRequirements: 'Wheelchair accessible',
        contactType: 'client',
        contactStatus: 'traveling',
        becameClientAt: new Date('2022-06-01'),
        marketingEmailOptIn: true,
        marketingSmsOptIn: false,
        marketingOptInSource: 'Referral',
        tags: ['Accessibility Needs'],
      },
      {
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@email.com',
        phone: '(555) 234-5679',
        dateOfBirth: '1978-11-25',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Married',
        addressLine1: '456 Oak Ave',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1A1',
        country: 'CAN',
        passportNumber: 'CA44332211',
        passportExpiry: '2025-03-15',
        passportCountry: 'CAN',
        nationality: 'CAN',
        contactType: 'client',
        contactStatus: 'traveling',
        becameClientAt: new Date('2022-06-01'),
        tags: [],
      },

      // Corporate Clients
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@techcorp.com',
        phone: '(555) 345-6789',
        dateOfBirth: '1985-07-14',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Single',
        addressLine1: '789 Business Blvd',
        addressLine2: 'Suite 300',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9',
        country: 'CAN',
        passportNumber: 'CA55667788',
        passportExpiry: '2028-09-30',
        passportCountry: 'CAN',
        nationality: 'CAN',
        knownTravelerNumber: 'KTN9876543',
        redressNumber: 'RDR123456',
        seatPreference: 'Aisle',
        cabinPreference: 'Business',
        contactType: 'client',
        contactStatus: 'awaiting_next',
        becameClientAt: new Date('2021-03-20'),
        marketingEmailOptIn: false,
        tags: ['Corporate', 'Frequent Traveler'],
      },
      {
        firstName: 'Jessica',
        lastName: 'Martinez',
        email: 'j.martinez@techcorp.com',
        phone: '(555) 345-6790',
        dateOfBirth: '1990-02-28',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Single',
        addressLine1: '789 Business Blvd',
        addressLine2: 'Suite 300',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9',
        country: 'CAN',
        passportNumber: 'CA99887766',
        passportExpiry: '2027-12-31',
        passportCountry: 'CAN',
        nationality: 'CAN',
        seatPreference: 'Window',
        cabinPreference: 'Business',
        contactType: 'client',
        contactStatus: 'quoted',
        becameClientAt: new Date('2021-03-20'),
        tags: ['Corporate'],
      },

      // Wedding Party
      {
        firstName: 'Alex',
        lastName: 'Taylor',
        preferredName: 'Alex',
        email: 'alex.taylor@email.com',
        phone: '(555) 456-7890',
        dateOfBirth: '1992-06-18',
        gender: 'Non-binary',
        pronouns: 'they/them',
        maritalStatus: 'Engaged',
        addressLine1: '321 Elm Street',
        city: 'Montreal',
        province: 'QC',
        postalCode: 'H3B 2Y5',
        country: 'CAN',
        passportNumber: 'CA11112222',
        passportExpiry: '2026-08-15',
        passportCountry: 'CAN',
        nationality: 'CAN',
        dietaryRequirements: 'Vegan',
        contactType: 'client',
        contactStatus: 'booked',
        becameClientAt: new Date('2024-02-14'),
        marketingEmailOptIn: true,
        marketingSmsOptIn: true,
        marketingOptInSource: 'Instagram ad',
        tags: ['Wedding', 'LGBTQ+'],
      },
      {
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@email.com',
        phone: '(555) 456-7891',
        dateOfBirth: '1993-09-05',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Engaged',
        addressLine1: '321 Elm Street',
        city: 'Montreal',
        province: 'QC',
        postalCode: 'H3B 2Y5',
        country: 'CAN',
        passportNumber: 'CA33334444',
        passportExpiry: '2026-08-15',
        passportCountry: 'CAN',
        nationality: 'CAN',
        contactType: 'client',
        contactStatus: 'booked',
        becameClientAt: new Date('2024-02-14'),
        marketingEmailOptIn: true,
        tags: ['Wedding'],
      },

      // Leads (Prospective Clients)
      {
        firstName: 'Amanda',
        lastName: 'Brown',
        email: 'amanda.brown@email.com',
        phone: '(555) 567-8901',
        dateOfBirth: '1988-04-12',
        contactType: 'lead',
        contactStatus: 'prospecting',
        marketingEmailOptIn: true,
        marketingOptInSource: 'Trade show',
        tags: ['Cruise Interest'],
      },
      {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@email.com',
        phone: '(555) 567-8902',
        contactType: 'lead',
        contactStatus: 'prospecting',
        tags: ['Adventure Travel'],
      },

      // Additional clients for variety
      {
        firstName: 'Linda',
        lastName: 'Anderson',
        email: 'linda.anderson@email.com',
        phone: '(555) 678-9012',
        dateOfBirth: '1970-12-03',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Widowed',
        addressLine1: '654 Pine Rd',
        city: 'Ottawa',
        province: 'ON',
        postalCode: 'K1A 0B1',
        country: 'CAN',
        passportNumber: 'CA55556666',
        passportExpiry: '2024-06-30', // Expiring soon!
        passportCountry: 'CAN',
        nationality: 'CAN',
        seatPreference: 'Aisle',
        contactType: 'client',
        contactStatus: 'returned',
        becameClientAt: new Date('2020-08-10'),
        marketingEmailOptIn: true,
        tags: ['Solo Traveler', 'Senior'],
      },
      {
        firstName: 'Christopher',
        lastName: 'Garcia',
        preferredName: 'Chris',
        email: 'chris.garcia@email.com',
        phone: '(555) 678-9013',
        dateOfBirth: '1995-01-20',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Single',
        addressLine1: '987 Maple Dr',
        city: 'Halifax',
        province: 'NS',
        postalCode: 'B3H 3Z1',
        country: 'CAN',
        passportNumber: 'CA77778888',
        passportExpiry: '2029-11-30',
        passportCountry: 'CAN',
        nationality: 'CAN',
        knownTravelerNumber: 'KTN1111222',
        seatPreference: 'Window',
        cabinPreference: 'Economy',
        dietaryRequirements: 'Gluten-free',
        contactType: 'client',
        contactStatus: 'awaiting_next',
        becameClientAt: new Date('2023-09-01'),
        marketingEmailOptIn: true,
        marketingSmsOptIn: true,
        tags: ['Young Professional', 'Backpacker'],
      },
      {
        firstName: 'Patricia',
        lastName: 'Thompson',
        email: 'patricia.thompson@email.com',
        phone: '(555) 789-0123',
        dateOfBirth: '1965-08-30',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Married',
        contactType: 'client',
        contactStatus: 'inactive',
        becameClientAt: new Date('2018-03-15'),
        tags: ['Inactive'],
      },
      {
        firstName: 'William',
        lastName: 'Moore',
        preferredName: 'Bill',
        email: 'bill.moore@email.com',
        phone: '(555) 890-1234',
        dateOfBirth: '1972-11-11',
        gender: 'Male',
        pronouns: 'he/him',
        maritalStatus: 'Divorced',
        passportNumber: 'CA99990000',
        passportExpiry: '2024-12-31', // Expiring in < 6 months
        passportCountry: 'CAN',
        nationality: 'CAN',
        contactType: 'client',
        contactStatus: 'prospecting',
        becameClientAt: new Date('2024-06-01'),
        tags: [],
      },
      {
        firstName: 'Jennifer',
        lastName: 'White',
        preferredName: 'Jen',
        email: 'jen.white@email.com',
        phone: '(555) 901-2345',
        dateOfBirth: '1987-03-25',
        contactType: 'lead',
        contactStatus: 'prospecting',
        marketingEmailOptIn: false,
        marketingOptOutAt: new Date('2024-10-01'),
        marketingOptOutReason: 'Too many emails',
        tags: [],
      },

      // International clients
      {
        firstName: 'Raj',
        lastName: 'Patel',
        email: 'raj.patel@email.com',
        phone: '+44 20 7946 0958',
        dateOfBirth: '1983-07-08',
        gender: 'Male',
        pronouns: 'he/him',
        addressLine1: '42 Baker Street',
        city: 'London',
        province: 'England',
        postalCode: 'W1U 3AA',
        country: 'GBR',
        passportNumber: 'GB12345678',
        passportExpiry: '2028-03-15',
        passportCountry: 'GBR',
        nationality: 'GBR',
        contactType: 'client',
        contactStatus: 'quoted',
        becameClientAt: new Date('2024-01-10'),
        tags: ['International', 'Europe'],
      },
      {
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@email.com',
        phone: '+52 55 1234 5678',
        dateOfBirth: '1979-05-17',
        gender: 'Female',
        pronouns: 'she/her',
        addressLine1: 'Av. Insurgentes Sur 1234',
        city: 'Mexico City',
        province: 'CDMX',
        postalCode: '03900',
        country: 'MEX',
        passportNumber: 'MX87654321',
        passportExpiry: '2026-09-20',
        passportCountry: 'MEX',
        nationality: 'MEX',
        contactType: 'client',
        contactStatus: 'booked',
        becameClientAt: new Date('2023-11-05'),
        tags: ['International', 'Latin America'],
      },

      // More variety
      {
        firstName: 'Thomas',
        lastName: 'Harris',
        preferredName: 'Tom',
        email: 'tom.harris@email.com',
        phone: '(555) 012-3456',
        dateOfBirth: '1991-09-14',
        contactType: 'lead',
        contactStatus: 'prospecting',
        tags: ['Sports Travel'],
      },
      {
        firstName: 'Susan',
        lastName: 'Clark',
        email: 'susan.clark@email.com',
        phone: '(555) 123-4567',
        dateOfBirth: '1968-06-22',
        gender: 'Female',
        pronouns: 'she/her',
        maritalStatus: 'Married',
        passportNumber: 'CA00001111',
        passportExpiry: '2027-04-30',
        passportCountry: 'CAN',
        nationality: 'CAN',
        seatPreference: 'Window',
        floorPreference: 'High Floor',
        contactType: 'client',
        contactStatus: 'returned',
        becameClientAt: new Date('2019-05-20'),
        tags: ['Luxury Travel'],
      },
      {
        firstName: 'Daniel',
        lastName: 'Lewis',
        preferredName: 'Dan',
        email: 'dan.lewis@email.com',
        phone: '(555) 234-5678',
        dateOfBirth: '1986-02-11',
        contactType: 'client',
        contactStatus: 'prospecting',
        becameClientAt: new Date('2024-08-15'),
        tags: [],
      },
      {
        firstName: 'Karen',
        lastName: 'Walker',
        email: 'karen.walker@email.com',
        phone: '(555) 345-6789',
        dateOfBirth: '1976-10-05',
        gender: 'Female',
        pronouns: 'she/her',
        contactType: 'lead',
        contactStatus: 'prospecting',
        marketingEmailOptIn: true,
        tags: ['Group Travel'],
      },

      // More test contacts for pagination
      ...Array.from({ length: 10 }, (_, i) => {
        const isClient = i % 3 !== 0
        return {
          firstName: `Contact${i + 1}`,
          lastName: `Test${i + 1}`,
          email: `contact${i + 1}.test${i + 1}@example.com`,
          phone: `(555) ${String(i).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
          contactType: (isClient ? 'client' : 'lead') as 'lead' | 'client',
          contactStatus: 'prospecting' as const,
          ...(isClient && { becameClientAt: new Date('2024-01-01') }),
          tags: [],
        }
      }),
    ]).returning()

    console.log(`✅ Created ${contacts.length} contacts`)

    // ========================================================================
    // CONTACT RELATIONSHIPS
    // ========================================================================
    console.log('Creating contact relationships...')

    const relationships = await db.insert(schema.contactRelationships).values([
      // Smith family
      {
        contactId1: contacts[0]!.id, // John Smith
        contactId2: contacts[1]!.id, // Sarah Smith
        category: 'family',
        labelForContact1: 'spouse',
        labelForContact2: 'spouse',
      },

      // Johnson family
      {
        contactId1: contacts[2]!.id, // Dave Johnson
        contactId2: contacts[3]!.id, // Emily Johnson
        category: 'family',
        labelForContact1: 'spouse',
        labelForContact2: 'spouse',
      },

      // Corporate colleagues
      {
        contactId1: contacts[4]!.id, // Michael Chen
        contactId2: contacts[5]!.id, // Jessica Martinez
        category: 'business',
        labelForContact1: 'colleague',
        labelForContact2: 'colleague',
      },

      // Wedding couple
      {
        contactId1: contacts[6]!.id, // Alex Taylor
        contactId2: contacts[7]!.id, // Jordan Lee
        category: 'family',
        labelForContact1: 'fiancé',
        labelForContact2: 'fiancée',
      },

      // Travel companions
      {
        contactId1: contacts[0]!.id, // John Smith
        contactId2: contacts[2]!.id, // Dave Johnson
        category: 'travel_companions',
        labelForContact1: 'travel buddy',
        labelForContact2: 'travel buddy',
      },

      // Friend relationships
      {
        contactId1: contacts[1]!.id, // Sarah Smith
        contactId2: contacts[3]!.id, // Emily Johnson
        category: 'family',
        labelForContact1: 'friend',
        labelForContact2: 'friend',
      },

      // Business + friend
      {
        contactId1: contacts[4]!.id, // Michael Chen
        contactId2: contacts[11]!.id, // Chris Garcia
        category: 'business',
        labelForContact1: 'mentor',
        labelForContact2: 'mentee',
      },

      // More friend relationships
      {
        contactId1: contacts[6]!.id, // Alex Taylor
        contactId2: contacts[11]!.id, // Chris Garcia
        category: 'family',
        labelForContact1: 'friend',
        labelForContact2: 'friend',
      },
    ]).returning()

    console.log(`✅ Created ${relationships.length} relationships`)

    // ========================================================================
    // CONTACT GROUPS
    // ========================================================================
    console.log('Creating contact groups...')

    const groups = await db.insert(schema.contactGroups).values([
      {
        name: 'Smith Family Trip 2024',
        groupType: 'family',
        description: 'Family vacation to Hawaii',
        primaryContactId: contacts[0]!.id, // John Smith
        tags: ['Hawaii', 'Family', 'Beach'],
      },
      {
        name: 'Johnson Family Cruise',
        groupType: 'family',
        description: 'Caribbean cruise',
        primaryContactId: contacts[2]!.id, // Dave Johnson
        tags: ['Cruise', 'Caribbean', 'Accessible'],
      },
      {
        name: 'TechCorp Executive Retreat',
        groupType: 'corporate',
        description: 'Annual corporate retreat',
        primaryContactId: contacts[4]!.id, // Michael Chen
        tags: ['Corporate', 'Business', 'Team Building'],
      },
      {
        name: 'Taylor-Lee Wedding Party',
        groupType: 'wedding',
        description: 'Destination wedding in Bali',
        primaryContactId: contacts[6]!.id, // Alex Taylor
        tags: ['Wedding', 'Bali', 'Destination'],
      },
      {
        name: 'Adventure Seekers Club',
        groupType: 'friends',
        description: 'Group of friends who love adventure travel',
        primaryContactId: contacts[11]!.id, // Chris Garcia
        tags: ['Adventure', 'Backpacking', 'Group'],
      },
    ]).returning()

    console.log(`✅ Created ${groups.length} contact groups`)

    // ========================================================================
    // CONTACT GROUP MEMBERS
    // ========================================================================
    console.log('Adding members to groups...')

    const members = await db.insert(schema.contactGroupMembers).values([
      // Smith Family
      {
        groupId: groups[0]!.id,
        contactId: contacts[0]!.id, // John
        role: 'Primary Contact',
        notes: 'Trip organizer and main payer',
      },
      {
        groupId: groups[0]!.id,
        contactId: contacts[1]!.id, // Sarah
        role: 'Spouse',
      },

      // Johnson Family
      {
        groupId: groups[1]!.id,
        contactId: contacts[2]!.id, // Dave
        role: 'Primary Contact',
        notes: 'Requires wheelchair accessible cabin',
      },
      {
        groupId: groups[1]!.id,
        contactId: contacts[3]!.id, // Emily
        role: 'Spouse',
      },

      // TechCorp
      {
        groupId: groups[2]!.id,
        contactId: contacts[4]!.id, // Michael
        role: 'Team Lead',
        notes: 'Budget approver',
      },
      {
        groupId: groups[2]!.id,
        contactId: contacts[5]!.id, // Jessica
        role: 'Team Member',
      },

      // Wedding Party
      {
        groupId: groups[3]!.id,
        contactId: contacts[6]!.id, // Alex
        role: 'Bride/Groom',
        notes: 'Planning coordinator',
      },
      {
        groupId: groups[3]!.id,
        contactId: contacts[7]!.id, // Jordan
        role: 'Bride/Groom',
      },

      // Adventure Seekers
      {
        groupId: groups[4]!.id,
        contactId: contacts[11]!.id, // Chris
        role: 'Organizer',
      },
      {
        groupId: groups[4]!.id,
        contactId: contacts[0]!.id, // John
        role: 'Member',
      },
      {
        groupId: groups[4]!.id,
        contactId: contacts[2]!.id, // Dave
        role: 'Member',
      },
    ]).returning()

    console.log(`✅ Added ${members.length} group members`)

    console.log('✅ Database seeded successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   - ${contacts.length} contacts`)
    console.log(`   - ${relationships.length} relationships`)
    console.log(`   - ${groups.length} groups`)
    console.log(`   - ${members.length} group members`)
    console.log('')
    console.log('💡 Test scenarios available:')
    console.log('   - Expiring passports: Linda Anderson (Jun 2024), Bill Moore (Dec 2024)')
    console.log('   - LGBTQ+ inclusive: Alex Taylor (they/them, non-binary)')
    console.log('   - International: Raj Patel (UK), Maria Rodriguez (Mexico)')
    console.log('   - Accessibility: Dave Johnson (wheelchair)')
    console.log('   - Marketing opt-out: Jennifer White')
    console.log('   - Corporate group: TechCorp (Michael Chen + Jessica Martinez)')
    console.log('   - Wedding group: Taylor-Lee Wedding Party')
    console.log('   - Family groups: Smith Family, Johnson Family')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await connection.end()
  }
}
