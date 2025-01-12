import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function UpgradeYourPlan(){
    return <div className="flex flex-col items-center justify-center gap-6 text-center">
        <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center border-red-200 border-2 bg-red-100 p-4 rounded-lg border-dashed">
         Please upgrade your plans to the pro version continue to explore the cool feature offered! 
        </p>
        <Link className="flex gap-2 items-center text-purple-600 font-semibold" href="/#pricing">
         Go to pricing <ArrowRight className="w-4 h-4"/>
        </Link>
    </div>
}