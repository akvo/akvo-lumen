// A form definition example. Does not include response data
{
    id: "1234",
    surveyId: "2345",
    name: "A Form",
    questionGroups: [
	{
	    id: "3456",
	    name: "A Question Group",
	    isRepeatable: false,
	    questions: [
		{
		    id: "4567"
		    name: "A Question?"
		    type: "FREE_TEXT"
		},
		{
		    id: "3765"
		    name: "Another Question?"
		    type: "VIDEO"
		}
	    ]
	},
	{
	    id: "2543",
	    name: "Another Question Group",
	    isRepeatable: true,
	    questions: [
		{
		    id: "3444",
		    name: "Yet Another Question?",
		    type: "OPTION"
		}
	    ]
	}
    ]
}
