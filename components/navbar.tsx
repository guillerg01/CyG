"use client";

import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { IconCurrencyDollar } from "@tabler/icons-react";

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky" className="bg-zinc-900 border-b border-zinc-800">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link className="flex justify-start items-center gap-2" href="/dashboard">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <IconCurrencyDollar className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-white">CyG Finance</p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            href="/dashboard"
            variant="flat"
          >
            Dashboard
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
