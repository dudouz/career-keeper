"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">
              Career Keeper
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-blue-950 dark:via-background dark:to-violet-950" />
        <div className="container relative px-4 md:px-8">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <Badge className="mb-4" variant="secondary">
              🚀 AI-Powered Resume Builder
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Turn Your GitHub Activity Into a{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Killer Resume
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground md:text-2xl">
              Automatically extract resume-worthy achievements from your GitHub contributions using
              AI. Keep your resume up-to-date effortlessly.
            </p>
            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 text-lg">
                  Start Building Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8 text-lg">
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
      <section className="border-t py-20">
        <div className="container px-4 md:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold md:text-5xl">How It Works</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Three simple steps to transform your GitHub activity into a professional resume
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20" />
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-2xl font-bold text-white">
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

              <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20" />
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500 text-2xl font-bold text-white">
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

              <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500 text-2xl font-bold text-white">
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
      <section id="features" className="bg-muted/50 py-20">
        <div className="container px-4 md:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold md:text-5xl">Powerful Features</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Everything you need to create, maintain, and optimize your developer resume
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">📊</div>
                  <CardTitle>GitHub Scanning</CardTitle>
                  <CardDescription>
                    Automatically analyze your contributions across all repositories
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">🤖</div>
                  <CardTitle>AI-Powered</CardTitle>
                  <CardDescription>
                    GPT-4 extracts achievements and generates professional content
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">📝</div>
                  <CardTitle>Achievements Generator</CardTitle>
                  <CardDescription>
                    Organize your accomplishments with smart categorization
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">🔄</div>
                  <CardTitle>Resume Comparison</CardTitle>
                  <CardDescription>
                    Side-by-side diff showing what to add to your resume
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">📄</div>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>
                    Download as PDF or TXT, optimized for ATS systems
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 text-3xl">🔒</div>
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
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold md:text-5xl">Simple, Transparent Pricing</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Start free, upgrade when you need more power
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
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
                      <span>AI-powered achievements</span>
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
              <Card className="relative overflow-hidden border-2 border-blue-500">
                <div className="absolute right-0 top-0 bg-blue-500 px-3 py-1 text-sm font-medium text-white">
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
      <section className="bg-gradient-to-r from-blue-600 to-violet-600 py-20 text-white">
        <div className="container px-4 md:px-8">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <h2 className="text-3xl font-bold md:text-5xl">Ready to Build Your Perfect Resume?</h2>
            <p className="text-xl opacity-90">
              Join developers who are landing their dream jobs with AI-powered resumes
            </p>
            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="px-8 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-transparent px-8 text-lg text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container px-4 md:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent">
                Career Keeper
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered resume builder for developers. Turn your GitHub activity into career
                opportunities.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="transition-colors hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="transition-colors hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="transition-colors hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/docs" className="transition-colors hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="transition-colors hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="transition-colors hover:text-foreground">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="transition-colors hover:text-foreground">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-6xl border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Career Keeper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
