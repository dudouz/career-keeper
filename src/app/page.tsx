import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Career Keeper
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-blue-950 dark:via-background dark:to-violet-950" />
        <div className="container relative px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="mb-4" variant="secondary">
              🚀 AI-Powered Resume Builder
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Turn Your GitHub Activity Into a{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Killer Resume
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Automatically extract resume-worthy achievements from your GitHub contributions using AI. 
              Keep your resume up-to-date effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Building Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>AI-powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t">
        <div className="container px-4 md:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to transform your GitHub activity into a professional resume
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full -mr-16 -mt-16" />
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mb-4">
                    1
                  </div>
                  <CardTitle>Connect GitHub</CardTitle>
                  <CardDescription>
                    Securely connect your GitHub account to scan your contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Analyzes commits, PRs, and issues</li>
                    <li>• Identifies key projects</li>
                    <li>• Extracts technical skills</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full -mr-16 -mt-16" />
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-violet-500 text-white flex items-center justify-center text-2xl font-bold mb-4">
                    2
                  </div>
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>
                    Our AI transforms your contributions into achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Generates professional summaries</li>
                    <li>• Highlights quantifiable impact</li>
                    <li>• Suggests improvements</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-16 -mt-16" />
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-500 text-white flex items-center justify-center text-2xl font-bold mb-4">
                    3
                  </div>
                  <CardTitle>Export & Apply</CardTitle>
                  <CardDescription>
                    Download your polished resume and start applying
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Export as PDF or TXT</li>
                    <li>• ATS-friendly formatting</li>
                    <li>• Always up-to-date</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container px-4 md:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, maintain, and optimize your developer resume
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">📊</div>
                  <CardTitle>GitHub Scanning</CardTitle>
                  <CardDescription>
                    Automatically analyze your contributions across all repositories
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🤖</div>
                  <CardTitle>AI-Powered</CardTitle>
                  <CardDescription>
                    GPT-4 extracts achievements and generates professional content
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">📝</div>
                  <CardTitle>Brag List Generator</CardTitle>
                  <CardDescription>
                    Organize your accomplishments with smart categorization
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🔄</div>
                  <CardTitle>Resume Comparison</CardTitle>
                  <CardDescription>
                    Side-by-side diff showing what to add to your resume
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">📄</div>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>
                    Download as PDF or TXT, optimized for ATS systems
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🔒</div>
                  <CardTitle>Privacy First</CardTitle>
                  <CardDescription>
                    Your data stays secure. API keys never stored in database
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container px-4 md:px-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you need more power
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Tier */}
              <Card className="border-2">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Basic</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>Perfect for getting started</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>GitHub contribution scanning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>AI-powered brag list</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Resume comparison</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>PDF & TXT export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>1 resume version</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <span>✗</span>
                      <span>Rich text editor</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <span>✗</span>
                      <span>Version control</span>
                    </li>
                  </ul>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full" variant="outline" size="lg">
                      Start Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Premium Tier */}
              <Card className="border-2 border-blue-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                  Popular
                </div>
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Premium</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">$9</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>For serious professionals</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="font-medium">Everything in Basic</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Rich text editor</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Unlimited resume versions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Version control & history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>LinkedIn integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full" size="lg">
                      Upgrade to Premium
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <div className="container px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Build Your Perfect Resume?
            </h2>
            <p className="text-xl opacity-90">
              Join developers who are landing their dream jobs with AI-powered resumes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/50">
        <div className="container px-4 md:px-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Career Keeper
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered resume builder for developers. Turn your GitHub activity into career opportunities.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/docs" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-foreground transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Career Keeper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
