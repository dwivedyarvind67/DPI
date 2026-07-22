"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePipelineStore } from "@/store/pipelineStore";
import { api } from "@/lib/api";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

const ruleSchema = z.object({
  field: z.enum(["dport", "proto", "srcIp", "dstIp"]),
  op: z.enum(["=", "!="]),
  value: z.string().min(1, "Value is required"),
  action: z.enum(["forward", "drop"]),
});

export function RuleEditor() {
  const rules = usePipelineStore((state) => state.rules);
  const setRules = usePipelineStore((state) => state.setRules);
  const addRuleToStore = usePipelineStore((state) => state.addRule);
  const removeRuleFromStore = usePipelineStore((state) => state.removeRule);
  
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      field: "dport",
      op: "=",
      value: "",
      action: "drop",
    },
  });

  useEffect(() => {
    api.rules.get().then((data) => {
      setRules(data);
      setLoading(false);
    });
  }, [setRules]);

  const onSubmit = async (values: z.infer<typeof ruleSchema>) => {
    const newRule = await api.rules.add(values as Omit<import('@/lib/types').Rule, 'id'>);
    addRuleToStore(newRule);
    form.reset({ ...values, value: "" });
  };

  const handleDelete = async (id: string) => {
    await api.rules.delete(id);
    removeRuleFromStore(id);
  };

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader>
        <CardTitle>Filtering Rules</CardTitle>
        <CardDescription>Define packet classification and drop policies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 items-start">
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem className="w-full sm:w-[150px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dport">Dest Port</SelectItem>
                      <SelectItem value="proto">Protocol</SelectItem>
                      <SelectItem value="srcIp">Source IP</SelectItem>
                      <SelectItem value="dstIp">Dest IP</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="op"
              render={({ field }) => (
                <FormItem className="w-full sm:w-[80px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Op" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="=">==</SelectItem>
                      <SelectItem value="!=">!=</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Value (e.g. 443, 192.168.1.1)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="w-full sm:w-[120px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="forward">Forward</SelectItem>
                      <SelectItem value="drop">Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button type="submit" size="icon" className="shrink-0"><Plus className="w-4 h-4" /></Button>
          </form>
        </Form>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Loading rules...</TableCell></TableRow>
              ) : rules.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No active rules.</TableCell></TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-sm">
                      {rule.field} {rule.op} &quot;{rule.value}&quot;
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.action === "drop" ? "destructive" : "default"}>
                        {rule.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
