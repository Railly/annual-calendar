export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  color: string
  image?: string
}

export interface DayNote {
  id: string
  date: Date
  content: string
}

export interface DayImage {
  date: string // ISO date string for easy lookup
  imageUrl: string
}

// Sample events for 2026 with descriptions
export const sampleEvents: CalendarEvent[] = [
  // January
  {
    id: "1",
    title: "New Year's Day",
    description: "Ring in 2026 with family and friends. Traditional midnight countdown followed by brunch.",
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 0, 1),
    color: "orange",
  },
  {
    id: "2",
    title: "Family in DC",
    description: "Visiting the Smithsonian museums, National Mall, and catching up with cousins in Georgetown.",
    startDate: new Date(2026, 0, 4),
    endDate: new Date(2026, 0, 8),
    color: "teal",
  },
  {
    id: "3",
    title: "Martin Luther King Jr. Day",
    description: "Federal holiday honoring the civil rights leader. Community service event at local food bank.",
    startDate: new Date(2026, 0, 19),
    endDate: new Date(2026, 0, 19),
    color: "purple",
  },
  {
    id: "4",
    title: "Lean in CA",
    description: "Leadership conference in San Francisco. Keynote by Sheryl Sandberg, networking events planned.",
    startDate: new Date(2026, 0, 16),
    endDate: new Date(2026, 0, 18),
    color: "green",
  },

  // February
  {
    id: "5",
    title: "Galentine's",
    description: "Girls' night out! Dinner at the new Italian place downtown, followed by a spa evening.",
    startDate: new Date(2026, 1, 1),
    endDate: new Date(2026, 1, 1),
    color: "pink",
  },
  {
    id: "6",
    title: "Valentine's Day",
    description: "Reservations at Eleven Madison Park. Anniversary celebration - 5 years!",
    startDate: new Date(2026, 1, 14),
    endDate: new Date(2026, 1, 14),
    color: "pink",
  },
  {
    id: "7",
    title: "Presidents' Day",
    description: "Federal holiday. Planning a day trip to the mountains if weather permits.",
    startDate: new Date(2026, 1, 16),
    endDate: new Date(2026, 1, 16),
    color: "blue",
  },
  {
    id: "8",
    title: "School Closed - Midwinter Recess",
    description: "Kids are off school for the week. Planning activities: museum visit, ice skating, movie marathon.",
    startDate: new Date(2026, 1, 16),
    endDate: new Date(2026, 1, 20),
    color: "orange",
  },
  {
    id: "gabe-japan",
    title: "Gabe in Japan",
    description: "Gabe's exchange program in Tokyo. Daily video calls scheduled, care package sent.",
    startDate: new Date(2026, 1, 14),
    endDate: new Date(2026, 1, 18),
    color: "green",
  },

  // March
  {
    id: "9",
    title: "St. Patrick's Day",
    description: "Annual parade downtown. Wearing green, meeting friends at O'Malley's after.",
    startDate: new Date(2026, 2, 17),
    endDate: new Date(2026, 2, 17),
    color: "green",
  },
  {
    id: "10",
    title: "Spring Break",
    description: "Beach trip to Cancun! All-inclusive resort booked. Snorkeling and relaxation.",
    startDate: new Date(2026, 2, 14),
    endDate: new Date(2026, 2, 22),
    color: "teal",
  },
  {
    id: "rosa-birthday",
    title: "Rosa's Birthday",
    description: "Rosa turns 35! Surprise party at her favorite restaurant. Don't forget the cake!",
    startDate: new Date(2026, 1, 28),
    endDate: new Date(2026, 2, 4),
    color: "purple",
  },

  // April
  {
    id: "11",
    title: "Easter Sunday",
    description: "Easter brunch at grandma's house. Egg hunt for the kids in the backyard.",
    startDate: new Date(2026, 3, 5),
    endDate: new Date(2026, 3, 5),
    color: "purple",
  },
  {
    id: "12",
    title: "Easter Monday",
    description: "Recovery day. Leftovers and family board games.",
    startDate: new Date(2026, 3, 6),
    endDate: new Date(2026, 3, 6),
    color: "purple",
  },
  {
    id: "13",
    title: "School Closed - Spring Recess",
    description: "Spring break for the kids. Day camp enrolled, zoo trip planned for Wednesday.",
    startDate: new Date(2026, 3, 3),
    endDate: new Date(2026, 3, 10),
    color: "orange",
  },
  {
    id: "costa-rica",
    title: "Costa Rica [HOLD]",
    description: "Tentative trip to Costa Rica. Waiting on PTO approval. Volcano tours and rainforest hikes planned.",
    startDate: new Date(2026, 3, 2),
    endDate: new Date(2026, 3, 10),
    color: "yellow",
  },
  {
    id: "14",
    title: "Tax Day",
    description: "Deadline to file federal taxes. Accountant meeting scheduled for April 10th as backup.",
    startDate: new Date(2026, 3, 15),
    endDate: new Date(2026, 3, 15),
    color: "red",
  },

  // May
  {
    id: "15",
    title: "Cinco de Mayo",
    description: "Office fiesta! Bringing homemade guacamole. Margaritas after work with the team.",
    startDate: new Date(2026, 4, 5),
    endDate: new Date(2026, 4, 5),
    color: "orange",
  },
  {
    id: "16",
    title: "Mother's Day",
    description: "Brunch reservations at 11am. Kids making handmade cards. Flowers ordered from local florist.",
    startDate: new Date(2026, 4, 10),
    endDate: new Date(2026, 4, 10),
    color: "pink",
  },
  {
    id: "17",
    title: "Memorial Day",
    description: "BBQ at the lake house. Inviting neighbors. Fireworks at night if weather allows.",
    startDate: new Date(2026, 4, 25),
    endDate: new Date(2026, 4, 25),
    color: "blue",
  },
  {
    id: "school-closed-may",
    title: "School Closed",
    description: "Teacher professional development day. Kids staying with grandparents.",
    startDate: new Date(2026, 4, 25),
    endDate: new Date(2026, 4, 27),
    color: "orange",
  },
  {
    id: "18",
    title: "Visit Maxine in Stockholm",
    description: "Staying at Maxine's apartment in Södermalm. Day trips to Uppsala and archipelago planned.",
    startDate: new Date(2026, 4, 22),
    endDate: new Date(2026, 4, 30),
    color: "teal",
  },

  // June
  {
    id: "19",
    title: "Copenhagen Conference",
    description: "Annual tech conference. Presenting on Day 2. Hotel booked near Tivoli Gardens.",
    startDate: new Date(2026, 5, 8),
    endDate: new Date(2026, 5, 14),
    color: "purple",
  },
  {
    id: "20",
    title: "Father's Day",
    description: "Golf outing with Dad in the morning. Family dinner at his favorite steakhouse.",
    startDate: new Date(2026, 5, 21),
    endDate: new Date(2026, 5, 21),
    color: "blue",
  },
  {
    id: "21",
    title: "Flag Day",
    description: "Flying the flag! Community parade at 10am on Main Street.",
    startDate: new Date(2026, 5, 14),
    endDate: new Date(2026, 5, 14),
    color: "red",
  },
  {
    id: "22",
    title: "Goose in Summer Camp",
    description: "Two weeks at Camp Pinewood. Packing list: sleeping bag, flashlight, bug spray, stamped letters.",
    startDate: new Date(2026, 5, 15),
    endDate: new Date(2026, 5, 28),
    color: "green",
  },
  {
    id: "brian-efren",
    title: "Brian & Efren Visit",
    description: "Friends visiting from Austin. Planning brewery tour and hiking trip to the state park.",
    startDate: new Date(2026, 5, 14),
    endDate: new Date(2026, 5, 16),
    color: "teal",
  },
  {
    id: "last-day-school",
    title: "Last Day of School",
    description: "Summer begins! End of year ceremony at 1pm. Ice cream celebration after.",
    startDate: new Date(2026, 5, 19),
    endDate: new Date(2026, 5, 19),
    color: "purple",
  },
  {
    id: "school-closed-june",
    title: "School Closed",
    description: "Summer break begins! Planning activities calendar for the kids.",
    startDate: new Date(2026, 5, 22),
    endDate: new Date(2026, 5, 24),
    color: "orange",
  },
  {
    id: "china-hold",
    title: "China? [HOLD]",
    description: "Possible business trip to Shanghai. Awaiting client confirmation. Visa paperwork ready.",
    startDate: new Date(2026, 5, 12),
    endDate: new Date(2026, 5, 21),
    color: "yellow",
  },

  // July
  {
    id: "23",
    title: "Independence Day",
    description: "Fireworks at the waterfront! Picnic blanket and sparklers ready. BBQ starts at 4pm.",
    startDate: new Date(2026, 6, 4),
    endDate: new Date(2026, 6, 4),
    color: "red",
  },
  {
    id: "24",
    title: "Tahoe Mini Camp",
    description: "Family cabin rental at Lake Tahoe. Kayaking, hiking, and s'mores by the fire.",
    startDate: new Date(2026, 6, 22),
    endDate: new Date(2026, 6, 27),
    color: "teal",
  },
  {
    id: "25",
    title: "Bali Wedding",
    description: "Sarah & Mike's destination wedding in Ubud. Ceremony at sunset, reception at cliff-top villa.",
    startDate: new Date(2026, 6, 20),
    endDate: new Date(2026, 6, 27),
    color: "pink",
  },

  // August
  {
    id: "26",
    title: "M&D Visit",
    description: "Mom and Dad visiting for the week. Guest room prepped. Taking them to new farmers market.",
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 7, 5),
    color: "green",
  },
  {
    id: "27",
    title: "Bangkok",
    description: "Thailand adventure! Street food tour booked, temple visits, and cooking class on Day 3.",
    startDate: new Date(2026, 7, 8),
    endDate: new Date(2026, 7, 15),
    color: "orange",
  },

  // September
  {
    id: "28",
    title: "Labor Day",
    description: "End of summer celebration. Pool party and BBQ. Last swim of the season!",
    startDate: new Date(2026, 8, 7),
    endDate: new Date(2026, 8, 7),
    color: "blue",
  },
  {
    id: "29",
    title: "Bangkok Extended",
    description: "Extended Thailand trip. Chiang Mai added - elephant sanctuary visit planned.",
    startDate: new Date(2026, 8, 1),
    endDate: new Date(2026, 8, 7),
    color: "orange",
  },
  {
    id: "30",
    title: "Birthday weekend",
    description: "My birthday celebration! Spa day Saturday, dinner party Sunday with close friends.",
    startDate: new Date(2026, 8, 11),
    endDate: new Date(2026, 8, 13),
    color: "pink",
  },
  {
    id: "alex-birthday",
    title: "Alex's Birthday",
    description: "Alex turns 8! Superhero themed party at the park. Bounce house rented.",
    startDate: new Date(2026, 8, 19),
    endDate: new Date(2026, 8, 19),
    color: "purple",
  },
  {
    id: "maya-birthday",
    title: "Maya's Birthday",
    description: "Maya's sweet 16! Surprise party at the house. DJ booked, photo booth ready.",
    startDate: new Date(2026, 8, 26),
    endDate: new Date(2026, 8, 26),
    color: "pink",
  },

  // October
  {
    id: "31",
    title: "Columbus Day",
    description: "Long weekend! Planning a road trip to the mountains for fall foliage.",
    startDate: new Date(2026, 9, 12),
    endDate: new Date(2026, 9, 12),
    color: "blue",
  },
  {
    id: "32",
    title: "Halloween",
    description: "Costume contest at work! Kids trick-or-treating in the neighborhood. Pumpkins carved.",
    startDate: new Date(2026, 9, 31),
    endDate: new Date(2026, 9, 31),
    color: "orange",
  },
  {
    id: "33",
    title: "Oma Visit",
    description: "Grandmother visiting from Germany. Planning special German dinner, photo albums ready to share.",
    startDate: new Date(2026, 9, 20),
    endDate: new Date(2026, 9, 28),
    color: "teal",
  },
  {
    id: "marathon",
    title: "Marathon",
    description: "Running the city marathon! Training complete. Goal time: under 4 hours.",
    startDate: new Date(2026, 9, 20),
    endDate: new Date(2026, 9, 21),
    color: "green",
  },

  // November
  {
    id: "34",
    title: "Daylight Saving",
    description: "Fall back! Extra hour of sleep. Adjusting all clocks in the house.",
    startDate: new Date(2026, 10, 1),
    endDate: new Date(2026, 10, 1),
    color: "yellow",
  },
  {
    id: "35",
    title: "Election Day",
    description: "Remember to vote! Polling station opens at 6am. Taking kids to see democracy in action.",
    startDate: new Date(2026, 10, 3),
    endDate: new Date(2026, 10, 3),
    color: "red",
  },
  {
    id: "36",
    title: "Veterans Day",
    description: "Honoring veterans. Parade downtown at 11am. Grandpa's medals display at school.",
    startDate: new Date(2026, 10, 11),
    endDate: new Date(2026, 10, 11),
    color: "blue",
  },
  {
    id: "37",
    title: "Thanksgiving",
    description: "Hosting this year! 15 guests expected. Turkey ordered, pies being made fresh.",
    startDate: new Date(2026, 10, 26),
    endDate: new Date(2026, 10, 26),
    color: "orange",
  },
  {
    id: "38",
    title: "Black Friday",
    description: "Online shopping only this year. Wishlist ready, deals bookmarked. No crowds!",
    startDate: new Date(2026, 10, 27),
    endDate: new Date(2026, 10, 27),
    color: "purple",
  },
  {
    id: "39",
    title: "Indonesia",
    description: "Island hopping adventure! Bali, Komodo, and Raja Ampat. Diving gear packed.",
    startDate: new Date(2026, 10, 14),
    endDate: new Date(2026, 10, 24),
    color: "teal",
  },

  // December
  {
    id: "40",
    title: "Christmas Eve",
    description: "Family dinner and gift exchange. Midnight mass at St. Peter's. Cookies for Santa ready.",
    startDate: new Date(2026, 11, 24),
    endDate: new Date(2026, 11, 24),
    color: "red",
  },
  {
    id: "41",
    title: "Christmas Day",
    description: "Present opening at 8am! Big breakfast, then relaxing with new books and games.",
    startDate: new Date(2026, 11, 25),
    endDate: new Date(2026, 11, 25),
    color: "red",
  },
  {
    id: "42",
    title: "New Zealand",
    description: "Summer escape down under! Hobbiton tour, Milford Sound cruise, Auckland food scene.",
    startDate: new Date(2026, 11, 10),
    endDate: new Date(2026, 11, 20),
    color: "green",
  },
  {
    id: "43",
    title: "Singapore",
    description: "Stopover in Singapore. Gardens by the Bay, hawker centers, and Marina Bay Sands pool.",
    startDate: new Date(2026, 11, 5),
    endDate: new Date(2026, 11, 10),
    color: "purple",
  },
]
