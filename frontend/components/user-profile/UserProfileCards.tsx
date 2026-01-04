"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import styles from "./user-profile.module.css"

export function UserProfileCard(props: {
  title: string
  options?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={[styles.card, props.className].filter(Boolean).join(" ")}>
      <div className={styles.titleArea}>
        <h4 className={styles.cardTitle}>{props.title}</h4>
        <div className={styles.cardOptions}>{props.options}</div>
      </div>
      <div className={styles.chartWrapper}>{props.children}</div>
    </Card>
  )
}


